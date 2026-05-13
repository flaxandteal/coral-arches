"""
ResourceModel — base class for every WKRM-generated wrapper.

This is the central piece of the shim. Each WKRM (Person, Group, Monument, …)
becomes a subclass of ResourceModel with `_graphid` set. The subclass exposes
arches_orm-style classmethods (`find`, `all`, `where`) and instance methods
(`save`, `delete`) plus dynamic semantic attribute access via `__getattr__`.

Internally:
    - Tile/tree conversion uses alizarin's sync Rust functions
      (alizarin.tiles_to_json_tree, alizarin.json_tree_to_tiles).
    - Storage is Arches' Django models (Resource, TileModel).
    - Semantic attribute access walks the JSON tree directly (sync), with view
      models constructed lazily.
    - Permissions: respect `alizarin_django.adapter.get_user()` — if the user
      is None (admin / context_free), all nodegroups are permitted.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from typing import (
    Any,
    ClassVar,
    Dict,
    Iterable,
    Iterator,
    List,
    Optional,
    Tuple,
    Type,
)

import alizarin

from . import adapter, graph_loader

logger = logging.getLogger(__name__)


def _permitted_nodegroup_ids(user: Optional[Any], graphid: str) -> Optional[List[str]]:
    """
    Return the list of nodegroup UUIDs the user is allowed to read for this
    graph, or None if the user is admin (no filtering).
    """
    if user is None:
        return None  # admin / no context — no filter
    try:
        from arches.app.utils.permission_backend import get_nodegroups_by_perm

        nodegroups = get_nodegroups_by_perm(user, "models.read_nodegroup")
        # get_nodegroups_by_perm returns NodeGroup model instances
        return [str(ng.nodegroupid) for ng in nodegroups]
    except Exception as exc:
        logger.warning(
            "alizarin_django: permission lookup failed (%s) — defaulting to deny",
            exc,
        )
        return []


def _fetch_tiles_for_resource(
    resourceinstance_id: str,
    permitted: Optional[List[str]],
) -> List[Dict[str, Any]]:
    """Fetch tiles for one resource, optionally filtered by nodegroup perms."""
    from arches.app.models.models import TileModel

    qs = TileModel.objects.filter(resourceinstance_id=resourceinstance_id)
    if permitted is not None:
        qs = qs.filter(nodegroup_id__in=permitted)
    return [_tile_row_to_dict(t) for t in qs]


def _tile_row_to_dict(t: Any) -> Dict[str, Any]:
    """Coerce an Arches TileModel row to alizarin's tile dict shape."""
    return {
        "tileid": str(t.tileid),
        "resourceinstance_id": str(t.resourceinstance_id),
        "nodegroup_id": str(t.nodegroup_id),
        "parenttile_id": str(t.parenttile_id) if t.parenttile_id else None,
        "data": t.data or {},
        "sortorder": getattr(t, "sortorder", None),
        "provisionaledits": getattr(t, "provisionaledits", None),
    }


class _SemanticNode:
    """
    Sync walker over the JSON tree produced by alizarin.tiles_to_json_tree.

    Wraps a dict/list at some depth in the tree. Attribute access returns:
        - another _SemanticNode if the key is a nested object
        - a list of _SemanticNode if the key is an array
        - a leaf value (string, number, ConceptValueViewModel-like, …) otherwise

    This is intentionally permissive — coral-arches code uses
    `utilities.node_check(lambda: …)` to swallow AttributeErrors, so missing
    nodes raising AttributeError is the right behavior.
    """

    __slots__ = ("_data", "_path", "_model_remapping")

    def __init__(
        self,
        data: Any,
        path: str = "",
        model_remapping: Optional[Dict[str, str]] = None,
    ) -> None:
        self._data = data
        self._path = path
        self._model_remapping = model_remapping or {}

    def __repr__(self) -> str:  # pragma: no cover
        return f"<_SemanticNode path={self._path!r}>"

    def __bool__(self) -> bool:
        return bool(self._data)

    def __iter__(self) -> Iterator[Any]:
        if isinstance(self._data, list):
            for i, item in enumerate(self._data):
                yield _wrap_value(item, f"{self._path}[{i}]")
        elif isinstance(self._data, dict):
            yield from self._data
        else:
            raise TypeError(f"_SemanticNode at {self._path!r} is not iterable")

    def __len__(self) -> int:
        if isinstance(self._data, (list, dict, str)):
            return len(self._data)
        return 0 if self._data is None else 1

    def __getitem__(self, key: Any) -> Any:
        if isinstance(self._data, list):
            return _wrap_value(self._data[key], f"{self._path}[{key}]")
        if isinstance(self._data, dict):
            return _wrap_value(self._data[key], f"{self._path}.{key}")
        raise TypeError(
            f"_SemanticNode at {self._path!r} not subscriptable ({type(self._data).__name__})"
        )

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            raise AttributeError(name)
        # Apply remapping if configured
        actual = self._model_remapping.get(name, name)
        if "." in actual:
            # Multi-segment alias remap (e.g. "title" -> "title.title_text")
            node: Any = self
            for seg in actual.split("."):
                node = node._lookup(seg)
            return node
        return self._lookup(actual)

    def _lookup(self, name: str) -> Any:
        if isinstance(self._data, dict):
            if name not in self._data:
                raise AttributeError(
                    f"{self._path or '<root>'}: no such attribute {name!r}"
                )
            return _wrap_value(self._data[name], f"{self._path}.{name}")
        if isinstance(self._data, list):
            # Allow attribute access to project across a list of dicts.
            return [_wrap_value(item, f"{self._path}[*]")._lookup(name) for item in self._data]  # type: ignore[union-attr]
        raise AttributeError(name)

    def __str__(self) -> str:
        if isinstance(self._data, (str, int, float, bool)):
            return str(self._data)
        if isinstance(self._data, dict):
            # Common Arches localized-string shape
            for k in ("en", "value", "@value"):
                if k in self._data and isinstance(self._data[k], str):
                    return self._data[k]
        return json.dumps(self._data, default=str)


def _wrap_value(value: Any, path: str) -> Any:
    """Wrap a tree-leaf in a _SemanticNode unless it's a primitive.

    Detects Arches i18n string shape (e.g. {"en": {"value": "foo", "direction": "ltr"}}
    or {"en": "foo"}) and returns a StringViewModel — a `str` subclass — so the
    value works in both string contexts (.encode(), concatenation) and i18n
    contexts (.lang("fr")).

    Also detects resource-instance reference shape (a dict containing
    "resourceId") and returns a ResourceInstanceViewModel so callers iterating
    over related-resource lists can use `.id` to get the referenced UUID.
    """
    if value is None:
        return None
    if isinstance(value, dict):
        if _is_resource_instance_reference(value):
            from .view_models.resources import ResourceInstanceViewModel

            return ResourceInstanceViewModel(
                resource_id=value.get("resourceId"),
                graph_id=value.get("ontologyProperty"),
                display_value=str(value.get("resourceId") or ""),
            )
        if _is_i18n_string_shape(value):
            from .view_models.string import StringViewModel

            return StringViewModel(value)
    if isinstance(value, (dict, list)):
        return _SemanticNode(value, path)
    return value


_LANG_CODE_RE = re.compile(r"^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$")


def _is_i18n_string_shape(data: dict) -> bool:
    """Recognize Arches localized-string shapes.

    A dict is treated as an i18n string only when every key looks like a
    language code (e.g. "en", "en-US") and every value is either a string or
    a dict with a "value" key. This avoids collapsing non-i18n dicts that
    happen to have a string in their first value (notably resource-instance
    reference dicts like {"resourceId": "<uuid>"}) into a StringViewModel.
    """
    if not data:
        return False
    for key in data.keys():
        if not (isinstance(key, str) and _LANG_CODE_RE.match(key)):
            return False
    for v in data.values():
        if isinstance(v, str):
            continue
        if isinstance(v, dict) and "value" in v:
            continue
        return False
    return True


def _is_resource_instance_reference(data: dict) -> bool:
    """Recognize the resource-instance reference shape produced by alizarin.

    Tile data for resource-instance / resource-instance-list datatypes serializes
    each reference as a dict containing at least a `resourceId` field (alongside
    optional `ontologyProperty`, `inverseOntologyProperty`, `resourceXresourceId`).
    """
    return "resourceId" in data


class QueryBuilder:
    """
    Chainable query for a ResourceModel subclass.

    Supports:
        .where(**filters)        — additional Django-style filters on tile data
        .order_by(field)         — Django queryset order_by (passes through)
        .offset(start, count)    — paginated slice, returns a list of instances
        .count()                 — int total
        .get()                   — list of instances (use [0] to get first)
        iter(qb)                 — iterate over instances

    The query runs against `arches.app.models.models.TileModel` filtered by
    the model's graph_id. Tile filters are translated into JSONB queries on
    the `data` column where possible; unknown lookups fall back to in-memory
    filtering after fetch (slow but correct).
    """

    def __init__(self, model_cls: Type["ResourceModel"]) -> None:
        self._model_cls = model_cls
        self._filters: Dict[str, Any] = {}
        self._order_by: List[str] = []
        self._offset: int = 0
        self._limit: Optional[int] = None


    def where(self, **kwargs: Any) -> "QueryBuilder":
        new = self._clone()
        new._filters.update(kwargs)
        return new

    def order_by(self, *fields: str) -> "QueryBuilder":
        new = self._clone()
        new._order_by.extend(fields)
        return new

    def offset(self, start: int, count: Optional[int] = None) -> List["ResourceModel"]:
        new = self._clone()
        new._offset = start
        new._limit = count
        return list(new)

    def _clone(self) -> "QueryBuilder":
        c = QueryBuilder(self._model_cls)
        c._filters = dict(self._filters)
        c._order_by = list(self._order_by)
        c._offset = self._offset
        c._limit = self._limit
        return c


    def count(self) -> int:
        return len(self._resource_ids())

    def get(self) -> List["ResourceModel"]:
        return list(self)

    def __iter__(self) -> Iterator["ResourceModel"]:
        ids = self._resource_ids()
        if self._offset:
            ids = ids[self._offset :]
        if self._limit is not None:
            ids = ids[: self._limit]
        for rid in ids:
            inst = self._model_cls.find(rid)
            if inst is not None:
                yield inst


    def _resource_ids(self) -> List[str]:
        from arches.app.models.models import ResourceInstance

        qs = ResourceInstance.objects.filter(graph_id=self._model_cls._graphid)

        # Translate filters. Recognized:
        #   resourceid__startswith=… → ResourceInstance.name__startswith (best effort)
        #   <node_alias>=value → JSONB tile.data filter (resolved per-resource below)
        django_filters: Dict[str, Any] = {}
        tile_filters: Dict[str, Any] = {}
        for key, val in self._filters.items():
            if key.startswith("resourceid"):
                # Map resourceid* lookups onto the descriptor name field which
                # is what coral-arches actually relies on.
                django_filters[key.replace("resourceid", "name")] = val
            else:
                tile_filters[key] = val
        if django_filters:
            qs = qs.filter(**django_filters)

        # Order by — pass through where possible
        if self._order_by:
            try:
                qs = qs.order_by(*self._order_by)
            except Exception:
                logger.debug(
                    "QueryBuilder: order_by(%s) not applicable on ResourceInstance",
                    self._order_by,
                )

        ids = [str(ri["resourceinstanceid"]) for ri in qs.values("resourceinstanceid")]

        # If there are tile filters, we need to fetch each candidate and
        # check the tree. This is slow but correct.
        if tile_filters:
            kept: List[str] = []
            for rid in ids:
                inst = self._model_cls.find(rid)
                if inst is None:
                    continue
                if _matches_tile_filters(inst, tile_filters):
                    kept.append(rid)
            return kept
        return ids


def _matches_tile_filters(inst: "ResourceModel", filters: Dict[str, Any]) -> bool:
    """Check that an instance's tree matches every (alias=value) filter."""
    for alias, expected in filters.items():
        try:
            actual = getattr(inst, alias, None)
        except AttributeError:
            return False
        if actual is None:
            return False
        # _SemanticNode comparison via str()
        actual_str = str(actual)
        if str(expected) != actual_str:
            return False
    return True


class _WrapperMeta:
    """
    Implementation of `instance._` — exposes wrapper-internal access:

        instance._.resource             → underlying Arches Resource Django model
        instance._.values               → raw tree dict
        instance._._values              → alias for `.values` (arches_orm compat)

    And on the *class*:

        Model._._node_objects_by_alias() → dict of node alias → static node info
    """

    def __init__(self, owner: Any, is_class: bool) -> None:
        self._owner = owner
        self._is_class = is_class

    @property
    def resource(self) -> Any:
        if self._is_class:
            raise AttributeError("Model._.resource only available on instances")
        return self._owner._get_resource_row()

    @property
    def values(self) -> Dict[str, Any]:
        if self._is_class:
            return {}
        return self._owner._tree

    @property
    def _values(self) -> Dict[str, Any]:
        return self.values

    def _node_objects_by_alias(self) -> Dict[str, Any]:
        """Return alizarin StaticNode objects keyed by alias."""
        cls = self._owner if self._is_class else type(self._owner)
        graphid = cls._graphid
        graph_loader.register_graph(graphid)
        # Use alizarin's high-level model wrapper to get the node objects.
        from alizarin.model_wrapper import ResourceModelWrapper

        model = ResourceModelWrapper.from_graph_id(
            graph_loader.get_alizarin_graph_id(graphid) or graphid
        )
        return model.get_node_objects_by_alias()


class ResourceModel:
    """
    Base for every WKRM-generated wrapper class.

    Subclasses set:
        _graphid: str
        _wkrm: Dict[str, Any]   # the WKRM definition from settings
    """

    _graphid: ClassVar[str] = ""
    _wkrm: ClassVar[Dict[str, Any]] = {}


    # Names that should always be real Python instance attributes rather than
    # being routed into the semantic tree by __setattr__.
    _REAL_ATTRS: ClassVar[set] = {"id"}

    def __init__(self, resource_id: Optional[str] = None) -> None:
        # Bypass __setattr__ during __init__ so internal state lands as real
        # attributes regardless of name.
        object.__setattr__(self, "id", str(resource_id) if resource_id else None)
        object.__setattr__(self, "_tree", {})
        object.__setattr__(self, "_tiles", [])
        object.__setattr__(self, "_dirty", False)
        object.__setattr__(self, "_resource_row", None)
        # Eagerly create _sem_root over the (initially empty) tree so that
        # attributes set via __setattr__ are immediately readable through
        # __getattr__ (which delegates to _sem_root._lookup).
        cls = type(self)
        object.__setattr__(
            self,
            "_sem_root",
            _SemanticNode(
                self.__dict__["_tree"],
                path=cls.__name__,
                model_remapping=cls._wkrm.get("remapping", {}),
            ),
        )

    def __setattr__(self, name: str, value: Any) -> None:
        """
        Route public attribute writes into the semantic tree so they persist
        through save(). Names starting with `_` and the explicit `_REAL_ATTRS`
        set remain real Python attributes.

        Raw strings assigned to string-datatype fields are auto-wrapped in
        Arches' i18n shape ({lang: {value, direction}}) so alizarin's
        json_tree_to_tiles produces the right tile data.
        """
        if name.startswith("_") or name in self._REAL_ATTRS:
            object.__setattr__(self, name, value)
            return
        tree = self.__dict__.get("_tree")
        if tree is None:
            # Should not happen post-__init__, but stay safe.
            object.__setattr__(self, name, value)
            return
        if isinstance(value, str) and self._is_string_field(name):
            value = {"en": {"value": value, "direction": "ltr"}}
        tree[name] = value
        object.__setattr__(self, "_dirty", True)

    def _is_string_field(self, alias: str) -> bool:
        """Return True if the named field is a string-like datatype in this
        model's graph. Falls back to False on any introspection failure (so
        the value is stored as-is)."""
        try:
            cls = type(self)
            cache = cls.__dict__.get("_string_aliases_cache")
            if cache is None:
                from alizarin.model_wrapper import ResourceModelWrapper

                graph_loader.register_graph(cls._graphid)
                model = ResourceModelWrapper.from_graph_id(
                    graph_loader.get_alizarin_graph_id(cls._graphid) or cls._graphid
                )
                nodes = model.get_node_objects_by_alias()
                cache = {
                    a
                    for a, n in nodes.items()
                    if getattr(n, "datatype", "") in ("string", "concept")
                }
                # Cache on the class for subsequent calls.
                setattr(cls, "_string_aliases_cache", cache)
            return alias in cache
        except Exception:
            return False

    def __repr__(self) -> str:  # pragma: no cover
        return f"<{type(self).__name__} id={self.id}>"


    class _ClassMetaDescriptor:
        """Returns a _WrapperMeta when accessed on the *class* (not instance)."""

        def __get__(self, instance: Any, owner: Type["ResourceModel"]) -> Any:
            if instance is None:
                return _WrapperMeta(owner, is_class=True)
            return _WrapperMeta(instance, is_class=False)

    _ = _ClassMetaDescriptor()  # type: ignore[assignment]


    @classmethod
    def find(cls, resource_id: Any) -> Optional["ResourceModel"]:
        """Load a single resource instance by ID, or None if not found."""
        if not resource_id:
            return None
        from arches.app.models.models import ResourceInstance

        rid = str(resource_id)
        try:
            ri = ResourceInstance.objects.get(resourceinstanceid=rid)
        except ResourceInstance.DoesNotExist:
            return None
        if str(ri.graph_id) != cls._graphid:
            # Wrong graph — caller asked for the wrong type
            return None

        user = adapter.get_user()
        permitted = _permitted_nodegroup_ids(user, cls._graphid)
        tiles = _fetch_tiles_for_resource(rid, permitted)

        graph_loader.register_graph(cls._graphid)
        try:
            resource_payload = json.dumps(
                {
                    "resourceinstanceid": rid,
                    "graph_id": cls._graphid,
                    "tiles": tiles,
                },
                default=str,
            )
            tree_str = alizarin.tiles_to_json_tree(resource_payload)  # type: ignore[misc]
            tree = json.loads(tree_str) if isinstance(tree_str, str) else tree_str
        except Exception as exc:
            logger.warning(
                "alizarin_django: tiles_to_json_tree failed for %s/%s: %s",
                cls.__name__,
                rid,
                exc,
            )
            tree = {}

        inst = cls(resource_id=rid)
        inst._tree = tree if isinstance(tree, dict) else {}

        try:
            from alizarin.model_wrapper import ResourceModelWrapper

            graph_loader.register_graph(cls._graphid)
            model = ResourceModelWrapper.from_graph_id(
                graph_loader.get_alizarin_graph_id(cls._graphid) or cls._graphid
            )
            nodes_by_alias = model.get_node_objects_by_alias()
            nodegroups = model.get_nodegroup_objects()
            for alias, node in nodes_by_alias.items():
                if alias in inst._tree:
                    continue
                is_list_dt = node.datatype.endswith("-list")
                ng = nodegroups.get(node.nodegroup_id) if node.nodegroup_id else None
                is_card_n = bool(ng and ng.cardinality == "n")
                if is_list_dt or is_card_n:
                    inst._tree[alias] = []
        except Exception as exc:
            logger.debug("alizarin_django: list-default prefill skipped: %s", exc)

        inst._tiles = tiles
        inst._resource_row = ri
        inst._sem_root = _SemanticNode(
            inst._tree,
            path=cls.__name__,
            model_remapping=cls._wkrm.get("remapping", {}),
        )
        return inst

    @classmethod
    def all(cls) -> List["ResourceModel"]:
        """Return every instance of this model."""
        return list(QueryBuilder(cls))

    @classmethod
    def where(cls, **kwargs: Any) -> QueryBuilder:
        """Begin a chainable query."""
        return QueryBuilder(cls).where(**kwargs)


    def save(self) -> "ResourceModel":
        """
        Persist the in-memory tree back to Arches.

        Strategy: convert the tree back to tiles via alizarin.json_tree_to_tiles,
        then reconcile against existing TileModel rows for this resource (insert,
        update, delete) inside a transaction. Finally, call Resource.save() to
        re-index.
        """
        from arches.app.models.models import ResourceInstance, TileModel
        from arches.app.models.resource import Resource
        from django.db import transaction

        if self.id is None:
            self.id = str(uuid.uuid4())

        graph_loader.register_graph(self._graphid)
        try:
            new_tiles_str = alizarin.json_tree_to_tiles(  # type: ignore[misc]
                json.dumps(self._tree, default=str),
                str(self.id),
                str(self._graphid),
            )
            payload = (
                json.loads(new_tiles_str)
                if isinstance(new_tiles_str, str)
                else new_tiles_str
            )
        except Exception as exc:
            logger.error(
                "alizarin_django: json_tree_to_tiles failed for %s/%s: %s",
                type(self).__name__,
                self.id,
                exc,
            )
            raise

        # Extract tiles from alizarin's nested response shape:
        #   {"business_data": {"resources": [{"tiles": [...]}]}}
        new_tiles: List[Dict[str, Any]] = []
        if isinstance(payload, list):
            new_tiles = payload
        elif isinstance(payload, dict):
            try:
                resources = payload["business_data"]["resources"]
                if isinstance(resources, list) and resources:
                    new_tiles = resources[0].get("tiles", []) or []
            except (KeyError, TypeError, IndexError):
                new_tiles = []

        with transaction.atomic():
            # Ensure ResourceInstance row exists
            try:
                ri = ResourceInstance.objects.get(resourceinstanceid=self.id)
            except ResourceInstance.DoesNotExist:
                ri = ResourceInstance.objects.create(
                    resourceinstanceid=self.id,
                    graph_id=self._graphid,
                )

            existing = {
                str(t.tileid): t
                for t in TileModel.objects.filter(resourceinstance_id=self.id)
            }
            seen: set[str] = set()

            for tile in new_tiles:
                tid = str(tile.get("tileid") or uuid.uuid4())
                seen.add(tid)
                if tid in existing:
                    row = existing[tid]
                    row.data = tile.get("data", {})
                    row.save()
                else:
                    TileModel.objects.create(
                        tileid=tid,
                        resourceinstance_id=self.id,
                        nodegroup_id=tile.get("nodegroup_id"),
                        parenttile_id=tile.get("parenttile_id"),
                        data=tile.get("data", {}),
                        sortorder=tile.get("sortorder"),
                    )

            # Delete tiles that no longer exist in the new tree
            for tid, row in existing.items():
                if tid not in seen:
                    row.delete()

            # Re-index via Arches' Resource wrapper
            try:
                arches_res = Resource.objects.get(resourceinstanceid=self.id)
                arches_res.index()
            except Exception as exc:  # pragma: no cover
                logger.debug("alizarin_django: post-save reindex skipped: %s", exc)

        self._dirty = False
        return self

    def delete(self) -> None:
        """Delete this resource (cascades to tiles via Arches' Resource model)."""
        from arches.app.models.resource import Resource

        if not self.id:
            return
        try:
            r = Resource.objects.get(resourceinstanceid=self.id)
            r.delete()
        except Resource.DoesNotExist:
            return


    def __getattr__(self, name: str) -> Any:
        """
        Delegate unknown attributes to the semantic tree.

        Triggered only when normal lookup fails — `id`, `_tree`, `save`, etc.
        are real attrs and won't hit this.

        Returns None for unset top-level fields (matching arches_orm semantics
        where `instance.some_field` is None until populated). Nested lookups
        through _SemanticNode remain strict.
        """
        if name.startswith("_"):
            raise AttributeError(name)
        sem = object.__getattribute__(self, "_sem_root")
        if sem is None:
            return None
        try:
            return getattr(sem, name)
        except AttributeError:
            return None

    def _get_resource_row(self) -> Any:
        """Used by `_.resource` — fetch the underlying Arches Resource model."""
        if self._resource_row is not None:
            return self._resource_row
        from arches.app.models.resource import Resource

        if not self.id:
            return None
        try:
            self._resource_row = Resource.objects.get(resourceinstanceid=self.id)
        except Resource.DoesNotExist:
            return None
        return self._resource_row


__all__ = [
    "ResourceModel",
    "QueryBuilder",
]
