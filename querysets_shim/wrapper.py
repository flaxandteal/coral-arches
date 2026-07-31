"""
ResourceModel — base class for every WKRM-generated wrapper.

Each WKRM (Person, Group, Monument, …) becomes a subclass of ResourceModel
with `_graphid` set. The subclass exposes classmethods (`find`, `all`, `where`)
and instance methods (`save`, `delete`) plus dynamic semantic attribute access
via `__getattr__`.

Internally backed by arches-querysets' ResourceTileTree / TileTree. The
aliased_data tree from arches-querysets is converted to a flat dict that
_SemanticNode walks for attribute access.
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
    Iterator,
    List,
    Optional,
    Type,
)

from . import adapter

logger = logging.getLogger(__name__)


def _permitted_nodegroup_ids(user: Optional[Any], graphid: str) -> Optional[List[str]]:
    if user is None:
        return None
    try:
        from arches.app.utils.permission_backend import get_nodegroups_by_perm

        nodegroups = get_nodegroups_by_perm(user, "models.read_nodegroup")
        return [str(ng.nodegroupid) for ng in nodegroups]
    except Exception as exc:
        logger.warning(
            "querysets_shim: permission lookup failed (%s) — defaulting to deny",
            exc,
        )
        return []


def _value_to_concept_vm(val: Any) -> Any:
    """Wrap an Arches Value model instance as a ConceptValueViewModel."""
    from .view_models.concepts import ConceptValueViewModel

    return ConceptValueViewModel(
        concept_value_id=str(val.valueid),
        text=val.value,
        language=str(val.language_id) if val.language_id else None,
        concept_id=str(val.concept_id),
    )


def _render_i18n(value: Any) -> str:
    """Flatten an Arches i18n name to a plain string.

    `ResourceInstance.name` is stored as {"en": "Global Group"}; depending on
    the row's origin it arrives as that dict or as an I18n_String that already
    stringifies. Prefer the active language, then English, then whatever is set.
    """
    if value is None:
        return ""
    if isinstance(value, dict):
        from django.utils.translation import get_language

        for key in (get_language(), "en"):
            if key and value.get(key):
                return str(value[key])
        return next((str(v) for v in value.values() if v), "")
    return str(value)


def _typed_auth_leaf(datatype: Optional[str], raw: Any) -> Any:
    """Resolve the two Django-backed datatypes to the proxy models callers expect.

    Both `django-group` and `user` store a bare integer PK in tile data, and
    arches-querysets hands it straight back. Callers need the real object:
    `coral/permissions/casbin.py` reads `gp.pk` and calls
    `gp.user_set.set(users)` on a group's Django Group, and passes
    `person.user_account` to `_subj_to_str`, which type-tests it for User.

    A PK that no longer resolves yields MissingDjangoGroupViewModel rather than
    an exception — casbin already type-tests for that to warn and skip.
    """
    if raw is None or datatype not in ("django-group", "user"):
        return raw

    from django.contrib.auth.models import Group as DjangoGroup, User

    if datatype == "django-group":
        from .arches_django.datatypes.django_group import (
            DjangoGroupViewModel,
            MissingDjangoGroupViewModel,
        )

        if isinstance(raw, DjangoGroup):
            return raw
        try:
            return DjangoGroupViewModel.objects.get(pk=int(raw))
        except (DjangoGroupViewModel.DoesNotExist, TypeError, ValueError):
            logger.debug("querysets_shim: no auth_group for %r", raw)
            return MissingDjangoGroupViewModel()

    from .arches_django.datatypes.user import UserViewModel

    if isinstance(raw, User):
        return raw
    try:
        return UserViewModel.objects.get(pk=int(raw))
    except (UserViewModel.DoesNotExist, TypeError, ValueError):
        logger.debug("querysets_shim: no auth_user for %r", raw)
        return None


def _ri_to_resource_vm(ri: Any) -> Any:
    """Wrap an Arches ResourceInstance as the view model the caller expects.

    Where the target graph is a well-known resource model, hand back a *lazy*
    instance of that wrapper class rather than a bare ResourceInstanceViewModel:
    callers type-test related resources rather than duck-typing them.
    `coral/permissions/casbin.py` walks a Group's Members and needs
    `isinstance(member, Group)` to tell a sub-group from a Person before reading
    `person.user_account`, and `_obj_to_str` keys a permission object off
    `isinstance(obj, Set)` / `LogicalSet` / `ArchesPlugin` — all of which fall
    through to a plain `ri:` key when the leaf is untyped.

    It has to be lazy. Loading eagerly would make Group -> members -> Group
    recurse without bound, so nothing is fetched until an alias is read.
    """
    from .view_models.resources import ResourceInstanceViewModel
    from .wkrm import get_well_known_resource_model_by_graph_id

    graphid = getattr(ri, "graph_id", None)
    if graphid:
        cls = get_well_known_resource_model_by_graph_id(str(graphid))
        if cls is not None:
            return cls._lazy_ref(str(ri.pk), ri)

    return ResourceInstanceViewModel(
        resource_id=str(ri.pk),
        graph_id=str(ri.graph_id),
        display_value=str(ri.pk),
        instance=ri,
    )


def _collapse_self_grouping(alias: str, tree: Any) -> Any:
    """Drop the duplicated level a self-grouping *value* node produces.

    arches-querysets gives every nodegroup a TileTree keyed by the aliases
    inside it. Where the grouping node is semantic that is exactly right —
    `basic_info` -> {'name': ..., 'image': ..., 'source': ...}. But a nodegroup
    whose grouping node *is* its single value node carries the same alias at
    both levels, so it arrives as {'members': {'members': [...]}}. Reading
    `group.members` then yields the grouping wrapper, and iterating that
    produces the dict's keys — the literal string 'members' — instead of the
    members. On the coral Group graph that shape covers `members`,
    `arches_plugins`, `group_type` and `guideline_approval` (cardinality 1) and
    `django_group` (cardinality n).

    Collapsing is keyed on the alias appearing at both levels *and* being the
    only child, so a semantic nodegroup can never match.
    """
    if isinstance(tree, dict) and set(tree) == {alias}:
        return tree[alias]
    return tree


def _rtt_aliased_data_to_tree(
    obj: Any, datatypes: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Convert arches-querysets aliased_data (AliasedData / TileTree) to a flat
    dict tree that _SemanticNode can walk.

    AliasedData is a SimpleNamespace; child nodegroups appear as TileTree
    objects (cardinality 1) or lists of TileTree (cardinality n). Leaf values
    come from arches-querysets' to_python() — Value model instances for
    concepts, ResourceInstance objects for resource-instance refs — which we
    wrap in the querysets_shim view-model types so downstream isinstance
    checks continue to work.

    `datatypes` maps node alias -> datatype for the graph, used to resolve the
    Django-backed leaves that arrive as bare PKs. Aliases are unique per graph
    in Arches, so one flat map is valid at any depth of the recursion.
    """
    from arches_querysets.models import TileTree
    from arches.app.models.models import Value, ResourceInstance

    ad = obj
    if hasattr(obj, "aliased_data"):
        ad = obj.aliased_data
    if ad is None:
        return {}

    datatypes = datatypes or {}

    result: Dict[str, Any] = {}
    for key, val in vars(ad).items():
        if isinstance(val, TileTree):
            result[key] = _collapse_self_grouping(
                key, _rtt_aliased_data_to_tree(val, datatypes)
            )
        elif isinstance(val, Value):
            result[key] = _value_to_concept_vm(val)
        elif isinstance(val, ResourceInstance):
            from .view_models.resources import SingleRelatedResourceInstanceViewModel

            result[key] = SingleRelatedResourceInstanceViewModel(
                [_ri_to_resource_vm(val)]
            )
        elif isinstance(val, list):
            if val and isinstance(val[0], Value):
                from .view_models.concepts import ConceptListValueViewModel

                result[key] = ConceptListValueViewModel(
                    [_value_to_concept_vm(v) for v in val if isinstance(v, Value)]
                )
            elif val and isinstance(val[0], ResourceInstance):
                from .view_models.resources import RelatedResourceInstanceListViewModel

                result[key] = RelatedResourceInstanceListViewModel(
                    [_ri_to_resource_vm(ri) for ri in val if isinstance(ri, ResourceInstance)]
                )
            else:
                result[key] = [
                    _collapse_self_grouping(
                        key, _rtt_aliased_data_to_tree(item, datatypes)
                    )
                    if isinstance(item, TileTree)
                    else item
                    for item in val
                ]
        else:
            result[key] = _typed_auth_leaf(datatypes.get(key), val)
    return result


class _SemanticNode:
    """
    Sync walker over a dict tree.

    Wraps a dict/list at some depth in the tree. Attribute access returns:
        - another _SemanticNode if the key is a nested object
        - a list of _SemanticNode if the key is an array
        - a leaf value (string, number, ConceptValueViewModel-like, …) otherwise
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
        actual = self._model_remapping.get(name, name)
        if "." in actual:
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
            return [_wrap_value(item, f"{self._path}[*]")._lookup(name) for item in self._data]  # type: ignore[union-attr]
        raise AttributeError(name)

    def __str__(self) -> str:
        if isinstance(self._data, (str, int, float, bool)):
            return str(self._data)
        if isinstance(self._data, dict):
            for k in ("en", "value", "@value"):
                if k in self._data and isinstance(self._data[k], str):
                    return self._data[k]
        return json.dumps(self._data, default=str)


def _wrap_value(value: Any, path: str) -> Any:
    """Wrap a tree-leaf in a _SemanticNode unless it's a primitive.

    Detects Arches i18n string shape and returns a StringViewModel.
    Also detects resource-instance reference shape and returns a
    ResourceInstanceViewModel. View-model types already produced by
    _rtt_aliased_data_to_tree are passed through unchanged.
    """
    if value is None:
        return None
    from .view_models._base import ViewModel

    if isinstance(value, ViewModel):
        return value
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
    return "resourceId" in data


class QueryBuilder:
    """
    Chainable query for a ResourceModel subclass.

    Backed by arches-querysets' ResourceTileTreeQuerySet.
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
            ids = ids[self._offset:]
        if self._limit is not None:
            ids = ids[:self._limit]
        for rid in ids:
            inst = self._model_cls.find(rid)
            if inst is not None:
                yield inst

    def _resource_ids(self) -> List[str]:
        from arches.app.models.models import ResourceInstance

        qs = ResourceInstance.objects.filter(graph_id=self._model_cls._graphid)

        django_filters: Dict[str, Any] = {}
        tile_filters: Dict[str, Any] = {}
        for key, val in self._filters.items():
            if key.startswith("resourceid"):
                django_filters[key.replace("resourceid", "name")] = val
            else:
                tile_filters[key] = val
        if django_filters:
            qs = qs.filter(**django_filters)

        if self._order_by:
            try:
                qs = qs.order_by(*self._order_by)
            except Exception:
                logger.debug(
                    "QueryBuilder: order_by(%s) not applicable on ResourceInstance",
                    self._order_by,
                )

        ids = [str(ri["resourceinstanceid"]) for ri in qs.values("resourceinstanceid")]

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
    for alias, expected in filters.items():
        try:
            actual = getattr(inst, alias, None)
        except AttributeError:
            return False
        if actual is None:
            return False
        actual_str = str(actual)
        if str(expected) != actual_str:
            return False
    return True


class _WrapperMeta:
    """
    Implementation of `instance._` — exposes wrapper-internal access:

        instance._.resource             → underlying Arches Resource Django model
        instance._.values               → raw tree dict
        instance._._values              → alias for `.values`

    And on the *class*:

        Model._._node_objects_by_alias() → dict of node alias → Node model
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
        """Return Arches Node objects keyed by alias for this graph."""
        cls = self._owner if self._is_class else type(self._owner)
        graphid = cls._graphid
        cache = getattr(cls, "_node_alias_cache", None)
        if cache is not None:
            return cache
        from arches.app.models.models import Node

        nodes = Node.objects.filter(
            graph_id=graphid,
        ).exclude(
            datatype="semantic",
        ).exclude(
            nodegroup=None,
        ).select_related("nodegroup")
        result = {}
        for node in nodes:
            if node.alias:
                result[node.alias] = node
        cls._node_alias_cache = result
        return result

    def index(self) -> None:
        """Re-index the resource in Elasticsearch."""
        from arches.app.models.resource import Resource

        if self._is_class:
            raise AttributeError("Model._.index() only available on instances")
        owner = self._owner
        if not owner.id:
            return
        try:
            r = Resource.objects.get(resourceinstanceid=owner.id)
            r.index()
        except Resource.DoesNotExist:
            pass


class ResourceModel:
    """
    Base for every WKRM-generated wrapper class.

    Subclasses set:
        _graphid: str
        _wkrm: Dict[str, Any]   # the WKRM definition from settings
    """

    _graphid: ClassVar[str] = ""
    _wkrm: ClassVar[Dict[str, Any]] = {}

    _REAL_ATTRS: ClassVar[set] = {"id"}

    def __init__(self, resource_id: Optional[str] = None) -> None:
        object.__setattr__(self, "id", str(resource_id) if resource_id else None)
        object.__setattr__(self, "_tree", {})
        object.__setattr__(self, "_rtt", None)
        object.__setattr__(self, "_dirty", False)
        object.__setattr__(self, "_resource_row", None)
        object.__setattr__(self, "_lazy_pending", False)
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
        if name.startswith("_") or name in self._REAL_ATTRS:
            object.__setattr__(self, name, value)
            return
        # Writing into an unhydrated lazy reference would build a tree holding
        # only the new value, and save() deletes every tile not in that tree.
        self._hydrate()
        tree = self.__dict__.get("_tree")
        if tree is None:
            object.__setattr__(self, name, value)
            return
        if isinstance(value, str) and self._is_string_field(name):
            value = {"en": {"value": value, "direction": "ltr"}}
        tree[name] = value
        object.__setattr__(self, "_dirty", True)

    def _is_string_field(self, alias: str) -> bool:
        try:
            cls = type(self)
            cache = cls.__dict__.get("_string_aliases_cache")
            if cache is None:
                nodes = cls._._node_objects_by_alias()
                cache = {
                    a
                    for a, n in nodes.items()
                    if getattr(n, "datatype", "") in ("string", "concept")
                }
                setattr(cls, "_string_aliases_cache", cache)
            return alias in cache
        except Exception:
            return False

    def __repr__(self) -> str:  # pragma: no cover
        return f"<{type(self).__name__} id={self.id}>"

    class _ClassMetaDescriptor:
        def __get__(self, instance: Any, owner: Type["ResourceModel"]) -> Any:
            if instance is None:
                return _WrapperMeta(owner, is_class=True)
            return _WrapperMeta(instance, is_class=False)

    _ = _ClassMetaDescriptor()  # type: ignore[assignment]

    @classmethod
    def _get_graph_slug(cls) -> Optional[str]:
        """Return the graph slug for this model, looked up from DB."""
        from . import wkrm

        return wkrm.get_graph_slug(cls._graphid)

    @classmethod
    def _datatypes_by_alias(cls) -> Dict[str, str]:
        """alias -> datatype for this graph, for resolving Django-backed leaves."""
        cache = cls.__dict__.get("_datatype_alias_cache")
        if cache is None:
            cache = {
                alias: getattr(node, "datatype", "")
                for alias, node in cls._._node_objects_by_alias().items()
            }
            cls._datatype_alias_cache = cache
        return cache

    @classmethod
    def _lazy_ref(cls, resource_id: str, resource_row: Any = None) -> "ResourceModel":
        """An instance that is type-correct now and loads its tiles on first read.

        Related-resource leaves become these (see _ri_to_resource_vm). Building
        them eagerly is not an option — a Group's Members are Groups, so loading
        them would recurse without bound — but callers still have to be able to
        `isinstance` them, which a deferred proxy could not satisfy.
        """
        inst = cls(resource_id=resource_id)
        object.__setattr__(inst, "_resource_row", resource_row)
        object.__setattr__(inst, "_lazy_pending", True)
        return inst

    def _hydrate(self) -> None:
        """Load a lazy reference's tiles. Idempotent; a no-op once resolved."""
        if not object.__getattribute__(self, "_lazy_pending"):
            return
        # Cleared first: a resource that cannot be loaded must not retry on
        # every attribute access, and find() re-enters this class.
        object.__setattr__(self, "_lazy_pending", False)
        loaded = type(self).find(object.__getattribute__(self, "id"))
        if loaded is None:
            logger.debug(
                "querysets_shim: lazy reference %s could not be loaded",
                object.__getattribute__(self, "id"),
            )
            return
        for attr in ("_tree", "_rtt", "_resource_row", "_sem_root"):
            object.__setattr__(self, attr, object.__getattribute__(loaded, attr))

    @classmethod
    def find(cls, resource_id: Any) -> Optional["ResourceModel"]:
        """Load a single resource instance by ID, or None if not found."""
        if not resource_id:
            return None
        rid = str(resource_id)

        slug = cls._get_graph_slug()
        if slug:
            return cls._find_via_querysets(rid, slug)
        return cls._find_via_tiles(rid)

    @classmethod
    def _find_via_querysets(cls, rid: str, slug: str) -> Optional["ResourceModel"]:
        """Load using arches-querysets ResourceTileTree."""
        from arches_querysets.models import ResourceTileTree

        try:
            qs = ResourceTileTree.get_tiles(slug, resource_ids=[rid])
            rtt = qs.get(pk=rid)
        except (ResourceTileTree.DoesNotExist, ValueError) as exc:
            logger.debug("querysets_shim: find via querysets failed for %s: %s", rid, exc)
            return None

        tree = _rtt_aliased_data_to_tree(rtt, cls._datatypes_by_alias())

        inst = cls(resource_id=rid)
        inst._tree = tree
        inst._rtt = rtt
        inst._resource_row = rtt
        inst._sem_root = _SemanticNode(
            tree,
            path=cls.__name__,
            model_remapping=cls._wkrm.get("remapping", {}),
        )
        return inst

    @classmethod
    def _find_via_tiles(cls, rid: str) -> Optional["ResourceModel"]:
        """Fallback: load directly from TileModel when no graph slug is available."""
        from arches.app.models.models import ResourceInstance, TileModel

        try:
            ri = ResourceInstance.objects.get(resourceinstanceid=rid)
        except ResourceInstance.DoesNotExist:
            return None
        if str(ri.graph_id) != cls._graphid:
            return None

        user = adapter.get_user()
        permitted = _permitted_nodegroup_ids(user, cls._graphid)

        qs = TileModel.objects.filter(resourceinstance_id=rid)
        if permitted is not None:
            qs = qs.filter(nodegroup_id__in=permitted)
        tiles = list(qs)

        tree = _tiles_to_tree(tiles, cls._graphid)

        inst = cls(resource_id=rid)
        inst._tree = tree
        inst._resource_row = ri
        inst._sem_root = _SemanticNode(
            tree,
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
        """Persist the in-memory tree back to Arches."""
        from arches.app.models.models import ResourceInstance, TileModel
        from arches.app.models.resource import Resource
        from django.db import transaction

        if self.id is None:
            self.id = str(uuid.uuid4())

        # Same hazard as __setattr__: saving an unhydrated lazy reference would
        # write an empty tree and drop every existing tile.
        self._hydrate()

        new_tiles = _tree_to_tiles(self._tree, str(self.id), self._graphid)

        with transaction.atomic():
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

            for tid, row in existing.items():
                if tid not in seen:
                    row.delete()

            try:
                arches_res = Resource.objects.get(resourceinstanceid=self.id)
                arches_res.index()
            except Exception as exc:  # pragma: no cover
                logger.debug("querysets_shim: post-save reindex skipped: %s", exc)

        self._dirty = False
        return self

    def delete(self) -> None:
        """Delete this resource."""
        from arches.app.models.resource import Resource

        if not self.id:
            return
        try:
            r = Resource.objects.get(resourceinstanceid=self.id)
            r.delete()
        except Resource.DoesNotExist:
            return

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            raise AttributeError(name)
        self._hydrate()
        sem = object.__getattribute__(self, "_sem_root")
        if sem is None:
            return None
        try:
            return getattr(sem, name)
        except AttributeError:
            return None

    def __str__(self) -> str:
        """The resource's descriptor name.

        `coral/permissions/casbin.py` uses this as the `auth_group` name in
        `_ri_to_django_groups` and to look a Group back up by name in
        `_django_group_to_ri`, so the default object repr would create and match
        groups literally called "<Group id=...>". Read off the resource row
        rather than the tile tree so a lazy reference does not have to hydrate
        just to be printed.
        """
        row = self._get_resource_row()
        name = getattr(row, "name", None) if row is not None else None
        return _render_i18n(name) or str(object.__getattribute__(self, "id") or "")

    @property
    def graph_id(self) -> str:
        """Kept for parity with ResourceInstanceViewModel, which exposes it."""
        return type(self)._graphid

    def _get_resource_row(self) -> Any:
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


def _tiles_to_tree(tiles: List[Any], graphid: str) -> Dict[str, Any]:
    """Build a flat tree dict from raw TileModel objects.

    Used as fallback when arches-querysets is not available (no graph slug).
    Groups tile data by node alias using the graph's node definitions.
    """
    from arches.app.models.models import Node

    all_nodes = Node.objects.filter(graph_id=graphid).exclude(
        nodegroup=None
    ).select_related("nodegroup")

    alias_by_node_id: Dict[str, str] = {}
    grouping_node_alias: Dict[str, str] = {}
    nodegroup_cardinality: Dict[str, str] = {}
    datatype_by_node_id: Dict[str, str] = {}

    for node in all_nodes:
        nid = str(node.nodeid)
        ngid = str(node.nodegroup_id)
        datatype_by_node_id[nid] = getattr(node, "datatype", "")
        if node.alias:
            alias_by_node_id[nid] = node.alias
            if nid == ngid:
                grouping_node_alias[ngid] = node.alias
        if ngid not in nodegroup_cardinality:
            nodegroup_cardinality[ngid] = getattr(node.nodegroup, "cardinality", "1")

    top_tiles = [t for t in tiles if t.parenttile_id is None]
    child_tiles_by_parent: Dict[str, List[Any]] = {}
    for t in tiles:
        if t.parenttile_id:
            pid = str(t.parenttile_id)
            child_tiles_by_parent.setdefault(pid, []).append(t)

    def _process_tile(tile: Any) -> Dict[str, Any]:
        result: Dict[str, Any] = {}
        data = tile.data or {}
        for nid_str, val in data.items():
            alias = alias_by_node_id.get(nid_str)
            if alias:
                result[alias] = _typed_auth_leaf(datatype_by_node_id.get(nid_str), val)
        for child in child_tiles_by_parent.get(str(tile.tileid), []):
            child_ngid = str(child.nodegroup_id)
            child_data = _process_tile(child)
            ng_alias = grouping_node_alias.get(child_ngid)
            if not ng_alias:
                continue
            child_data = _collapse_self_grouping(ng_alias, child_data)
            if nodegroup_cardinality.get(child_ngid) == "n":
                result.setdefault(ng_alias, []).append(child_data)
            else:
                result[ng_alias] = child_data
        return result

    tree: Dict[str, Any] = {}
    for tile in top_tiles:
        tile_data = _process_tile(tile)
        ngid = str(tile.nodegroup_id)
        ng_alias = grouping_node_alias.get(ngid)
        if ng_alias:
            tile_data = _collapse_self_grouping(ng_alias, tile_data)
            if nodegroup_cardinality.get(ngid) == "n":
                tree.setdefault(ng_alias, []).append(tile_data)
            else:
                tree[ng_alias] = tile_data
        else:
            tree.update(tile_data)
    return tree


def _vm_to_tile_value(value: Any) -> Any:
    """Convert view-model types back to raw tile-data format for saving."""
    from .view_models.concepts import ConceptValueViewModel, ConceptListValueViewModel
    from .view_models.resources import ResourceInstanceViewModel, RelatedResourceInstanceListViewModel

    if isinstance(value, ConceptListValueViewModel):
        return [str.__str__(v) if isinstance(v, ConceptValueViewModel) else str(v) for v in value]
    if isinstance(value, ConceptValueViewModel):
        return str.__str__(value)
    if isinstance(value, RelatedResourceInstanceListViewModel):
        return [
            {"resourceId": v.id, "ontologyProperty": "", "inverseOntologyProperty": ""}
            for v in value
        ]
    if isinstance(value, ResourceInstanceViewModel):
        return [{"resourceId": value.id, "ontologyProperty": "", "inverseOntologyProperty": ""}]
    if isinstance(value, ResourceModel):
        # A related-resource leaf is now a lazy wrapper instance rather than a
        # ResourceInstanceViewModel (see _ri_to_resource_vm); without this it
        # would fall through and be written into tile data as an object.
        return [{"resourceId": value.id, "ontologyProperty": "", "inverseOntologyProperty": ""}]
    from django.contrib.auth.models import Group as _DjangoGroup, User as _User

    if isinstance(value, (_DjangoGroup, _User)):
        # django-group / user leaves round-trip as the bare PK they are stored as.
        return value.pk
    return value


# Datatypes whose *value* is a list, so a list means one tile rather than one
# tile per entry. Anything else on a cardinality-n nodegroup is multiple tiles.
_LIST_VALUED_DATATYPES = frozenset(
    {
        "concept-list",
        "domain-value-list",
        "resource-instance-list",
        "file-list",
        "annotation",
    }
)


def _collects_child_nodegroups(node: Any, value: Any) -> bool:
    """Is this alias a collector for nested nodegroups, or its own value?

    Only a *semantic* grouping node collects children. A self-grouping value
    node holds its own value, and its stored form — `{"en": {...}}` for a
    string, a list for `members` or `django_group` — looks exactly like a
    nested level. Without the datatype check it is shunted aside and silently
    dropped, which is how ArchesPlugin resources ended up with tiles whose
    `name` and `plugin_identifier` were null: every group's `Arches Plugins`
    then resolved to unusable records and no view_plugin policy was written.
    """
    if str(node.nodeid) != str(node.nodegroup_id):
        return False
    if getattr(node, "datatype", "") != "semantic":
        return False
    return isinstance(value, (dict, list))


def _tree_to_tiles(
    tree: Dict[str, Any],
    resource_id: str,
    graphid: str,
) -> List[Dict[str, Any]]:
    """Convert a flat tree dict back to tile dicts for saving.

    Walks the graph node definitions to map aliases back to node UUIDs and
    nodegroup UUIDs.
    """
    from arches.app.models.models import Node

    nodes = Node.objects.filter(graph_id=graphid).exclude(
        nodegroup=None
    ).select_related("nodegroup")

    node_by_alias: Dict[str, Any] = {}
    grouping_nodes: Dict[str, Any] = {}

    for node in nodes:
        if node.alias:
            node_by_alias[node.alias] = node
        if str(node.nodeid) == str(node.nodegroup_id):
            grouping_nodes[node.alias] = node if node.alias else None

    tiles: List[Dict[str, Any]] = []

    def _process_level(
        data: Dict[str, Any],
        parent_tile_id: Optional[str] = None,
    ) -> None:
        by_nodegroup: Dict[str, Dict[str, Any]] = {}
        child_groups: Dict[str, Any] = {}

        for alias, value in data.items():
            node = node_by_alias.get(alias)
            if node is None:
                continue
            ngid = str(node.nodegroup_id)
            nid = str(node.nodeid)

            if _collects_child_nodegroups(node, value):
                child_groups[alias] = value
                continue

            if (
                nid == ngid
                and isinstance(value, list)
                and getattr(node.nodegroup, "cardinality", "1") == "n"
                and getattr(node, "datatype", "") not in _LIST_VALUED_DATATYPES
            ):
                # A cardinality-n nodegroup whose grouping node is its own
                # value node stores one entry per tile (Group.django_group).
                for item in value:
                    tiles.append({
                        "tileid": str(uuid.uuid4()),
                        "resourceinstance_id": resource_id,
                        "nodegroup_id": ngid,
                        "parenttile_id": parent_tile_id,
                        "data": {nid: _vm_to_tile_value(item)},
                        "sortorder": 0,
                    })
                continue

            by_nodegroup.setdefault(ngid, {})[nid] = _vm_to_tile_value(value)

        for ngid, tile_data in by_nodegroup.items():
            tid = str(uuid.uuid4())
            tiles.append({
                "tileid": tid,
                "resourceinstance_id": resource_id,
                "nodegroup_id": ngid,
                "parenttile_id": parent_tile_id,
                "data": tile_data,
                "sortorder": 0,
            })

        for alias, value in child_groups.items():
            node = node_by_alias.get(alias) or grouping_nodes.get(alias)
            if node is None:
                continue
            ngid = str(node.nodegroup_id)

            items = value if isinstance(value, list) else [value]
            for item in items:
                if not isinstance(item, dict):
                    continue
                tid = str(uuid.uuid4())
                child_tile_data: Dict[str, Any] = {}
                nested_children: Dict[str, Any] = {}
                for k, v in item.items():
                    child_node = node_by_alias.get(k)
                    if child_node is None:
                        continue
                    child_nid = str(child_node.nodeid)
                    child_ngid = str(child_node.nodegroup_id)
                    if _collects_child_nodegroups(child_node, v):
                        nested_children[k] = v
                    elif child_ngid == ngid:
                        child_tile_data[child_nid] = _vm_to_tile_value(v)
                    else:
                        child_tile_data[child_nid] = _vm_to_tile_value(v)

                tiles.append({
                    "tileid": tid,
                    "resourceinstance_id": resource_id,
                    "nodegroup_id": ngid,
                    "parenttile_id": parent_tile_id,
                    "data": child_tile_data,
                    "sortorder": 0,
                })

                for nested_alias, nested_val in nested_children.items():
                    nested_items = nested_val if isinstance(nested_val, list) else [nested_val]
                    for ni in nested_items:
                        if isinstance(ni, dict):
                            _process_level(ni, parent_tile_id=tid)

    _process_level(tree)
    return tiles


__all__ = [
    "ResourceModel",
    "QueryBuilder",
]
