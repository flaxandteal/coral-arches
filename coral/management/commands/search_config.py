"""Author arches_search filter configs in the repo instead of the database.

``arches_search`` decides which nodes appear as SimpleSearch attribute filters
from a ``NodeFilterConfig`` row per (graph, slug). Its API is read-only, so the
rows have to be seeded - and they are keyed by node *alias* and graph *slug*,
not UUIDs, which makes them well suited to living in version control.

    python manage.py search_config generate      # graphs  -> coral/search_configs/*.json
    python manage.py search_config load-filters  # json    -> NodeFilterConfig rows
    python manage.py search_config gaps          # what cannot render yet, and why

Generated files record every searchable node, including ones arches_search
cannot render yet, each tagged with its support level. Inert entries are
deliberate: they show the gap rather than hiding it, and become live as
widgets land upstream.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Value
from django.db.models.fields.json import JSONField

from arches.app.models import models

CONFIG_DIR = Path(__file__).resolve().parents[2] / "search_configs"
CARD_CONFIG_DIR = Path(__file__).resolve().parents[2] / "report_configs"

# arches_search asks arches_modular_reports for two configs per graph:
#   "search"                 -> the result card itself
#   "search_result_expanded" -> the drop-down, fetched lazily on expand
# SearchResultCard renders ONLY what the config lists - there is no fallback -
# which is why cards are blank until these rows exist.
CARD_SLUG = "search"
EXPANDED_SLUG = "search_result_expanded"

# Renders the descriptor name as a link to the resource report, plus the
# description and lifecycle tag. Takes no config of its own - it reads injected
# descriptor data - so this is all the card needs to match the old one.
DESCRIPTOR_COMPONENT = "arches_search/SearchResults/components/DescriptorSection"
DATA_SECTION_COMPONENT = (
    "arches_modular_reports/ModularReport/components/DataSection"
)

# arches-search does not currently have widgets for all datatypes. We are generating
# config for all nodes, we then list the datatypes here that can be rendered and any 
# datatype not in this list is dropped.
RENDERABLE_DATATYPES = {"reference", "number"}

# Datatypes the backend can already filter on, via rows in
# arches_search_advancedsearchfacet. These work in AdvancedSearch today and need
# only a widget to work in SimpleSearch.
BACKEND_DATATYPES = {
    "boolean",
    "date",
    "edtf",
    "file-list",
    "geojson-feature-collection",
    "non-localized-string",
    "number",
    "reference",
    "resource-instance",
    "resource-instance-list",
    "string",
    "url",
}

SUPPORT_RENDERABLE = "renderable"
SUPPORT_BACKEND_ONLY = "backend-only"
SUPPORT_NONE = "unsupported"
# Some reference nodes are extremely large and crash the browser. This needs addressing
# upstream, this is a fix to cap the limit of items.
SUPPORT_LARGE_LIST = "large-list"

DEFAULT_MAX_LIST_ITEMS = 500

EXCLUDE_ALIAS_SUFFIXES = ("_metatype",)

# Whole cards that record provenance rather than anything someone scanning a
# search result reads. audit_metadata alone is 20 columns on 20 graphs.
EXCLUDE_NODEGROUP_SUFFIXES = ("_metadata",)


def support_for(datatype, list_size=None, max_list_items=DEFAULT_MAX_LIST_ITEMS):
    if datatype == "reference" and list_size is not None and list_size > max_list_items:
        return SUPPORT_LARGE_LIST
    if datatype in RENDERABLE_DATATYPES:
        return SUPPORT_RENDERABLE
    if datatype in BACKEND_DATATYPES:
        return SUPPORT_BACKEND_ONLY
    return SUPPORT_NONE


class Command(BaseCommand):
    help = "Generate and load arches_search node filter configs from the repo."

    def add_arguments(self, parser):
        parser.add_argument(
            "operation",
            choices=["generate", "load-filters", "gaps", "generate-cards", "load-cards"],
            help="What to do",
        )
        parser.add_argument(
            "--slug",
            default="filtering",
            help="NodeFilterConfig slug (default: filtering)",
        )
        parser.add_argument(
            "--graph",
            action="append",
            help="Limit to these graph slugs. Repeatable. Default: all resource models.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="generate: replace existing files instead of leaving them alone.",
        )
        parser.add_argument(
            "--max-list-items",
            type=int,
            default=DEFAULT_MAX_LIST_ITEMS,
            help=(
                "generate: reference nodes whose controlled list exceeds this are "
                f"marked '{SUPPORT_LARGE_LIST}' (default: {DEFAULT_MAX_LIST_ITEMS})."
            ),
        )
        parser.add_argument(
            "--include-structural",
            action="store_true",
            help=(
                "generate: keep structural nodes "
                f"({', '.join(EXCLUDE_ALIAS_SUFFIXES)}) that are normally excluded."
            ),
        )
        parser.add_argument(
            "--renderable-only",
            action="store_true",
            help="load-filters: skip nodes arches_search cannot render yet.",
        )
        parser.add_argument(
            "--prune-empty",
            action="store_true",
            help=(
                "load-cards: drop columns that hold no value in any tile of a "
                "nodegroup that has tiles, in THIS environment's database."
            ),
        )

    def handle(self, *args, **options):
        operation = options["operation"]
        if operation == "generate":
            self.generate(options)
        elif operation == "load-filters":
            self.load_filters(options)
        elif operation == "generate-cards":
            self.generate_cards(options)
        elif operation == "load-cards":
            self.load_cards(options)
        else:
            self.gaps(options)

    # -- helpers ---------------------------------------------------------

    def graphs(self, options):
        queryset = models.GraphModel.objects.filter(isresource=True).exclude(
            is_active=False
        )
        if options.get("graph"):
            queryset = queryset.filter(slug__in=options["graph"])
        return queryset.order_by("slug")

    def searchable_nodes(self, graph, include_structural=False):
        """Nodes worth offering as a filter: real data nodes, in card order."""
        queryset = (
            models.Node.objects.filter(graph_id=graph.graphid)
            .exclude(datatype__in=["semantic", "annotation"])
            .exclude(alias__isnull=True)
            .exclude(alias="")
            .select_related("nodegroup")
            .order_by("sortorder", "alias")
        )
        if not include_structural:
            for suffix in EXCLUDE_ALIAS_SUFFIXES:
                queryset = queryset.exclude(alias__endswith=suffix)
        return queryset

    def list_sizes(self):
        """Item count per controlled list id, fetched once per run."""
        from django.db.models import Count

        from arches_controlled_lists.models import List

        return {
            str(row["id"]): row["item_count"]
            for row in List.objects.annotate(item_count=Count("list_items")).values(
                "id", "item_count"
            )
        }

    def populated_aliases(self, nodegroup_id, rows):
        """Search through the existing database for the tiles and record
        which nodes have data. We then prune the empty columns.
        """
        tiles = models.TileModel.objects.filter(nodegroup_id=nodegroup_id)
        if not tiles.exists():
            return [alias for alias, _ in rows]

        return [
            alias
            for alias, nodeid in rows
            if tiles.filter(**{f"data__{nodeid}__isnull": False})
            .exclude(**{f"data__{nodeid}": Value(None, JSONField())})
            .exists()
        ]

    def path_for(self, graph_slug, slug):
        name = graph_slug if slug == "filtering" else f"{graph_slug}.{slug}"
        return CONFIG_DIR / f"{name}.json"

    # -- operations ------------------------------------------------------

    def generate(self, options):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        slug = options["slug"]
        max_list_items = options["max_list_items"]
        list_sizes = self.list_sizes()
        written = skipped = 0

        for graph in self.graphs(options):
            path = self.path_for(graph.slug, slug)
            if path.exists() and not options["overwrite"]:
                skipped += 1
                continue

            nodes = []
            for sortorder, node in enumerate(
                self.searchable_nodes(graph, options["include_structural"])
            ):
                nodes.append(
                    {
                        "node_alias": node.alias,
                        "label": str(node.name),
                        "sortorder": sortorder,
                        "datatype": node.datatype,
                        "support": support_for(
                            node.datatype,
                            list_sizes.get(str((node.config or {}).get("controlledList"))),
                            max_list_items,
                        ),
                    }
                )

            document = {
                "graph_slug": graph.slug,
                "graph_name": str(graph.name),
                "slug": slug,
                "nodes": nodes,
            }
            path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n")
            written += 1

            counts = self._counts(nodes)
            self.stdout.write(
                f"  {graph.slug:<32} {len(nodes):4d} nodes  "
                f"({counts[SUPPORT_RENDERABLE]} renderable, "
                f"{counts[SUPPORT_BACKEND_ONLY]} backend-only, "
                f"{counts[SUPPORT_LARGE_LIST]} large-list, "
                f"{counts[SUPPORT_NONE]} unsupported)"
            )

        self.stdout.write(
            self.style.SUCCESS(f"\nwrote {written} file(s) to {CONFIG_DIR}")
        )
        if skipped:
            self.stdout.write(f"left {skipped} existing file(s) alone (--overwrite to replace)")

    def load_filters(self, options):
        from arches_search.models.models import NodeFilterConfig

        slug = options["slug"]
        if not CONFIG_DIR.exists():
            raise CommandError(f"No config directory at {CONFIG_DIR}. Run generate first.")

        loaded = 0
        with transaction.atomic():
            for graph in self.graphs(options):
                path = self.path_for(graph.slug, slug)
                if not path.exists():
                    continue

                document = json.loads(path.read_text())
                nodes = document.get("nodes", [])
                # Unlike backend-only nodes, which AttributeFilters.vue drops for
                # want of a widget, a large-list node IS `reference` and renders -
                # ReferenceFilter fetches the whole controlled list ?flat=true and
                # gives it a Checkbox each. Loading these ships a browser hang, so
                # they go regardless of --renderable-only. Remove once a typeahead
                # widget lands upstream (the searchable endpoint already exists:
                # arches_controlled_lists filtered_controlled_list?term=).
                nodes = [n for n in nodes if n.get("support") != SUPPORT_LARGE_LIST]
                if options["renderable_only"]:
                    nodes = [n for n in nodes if n.get("support") == SUPPORT_RENDERABLE]

                # Store only the keys arches_search reads. The support/datatype
                # annotations stay in the repo where they are useful for review.
                config = {
                    "nodes": [
                        {
                            "node_alias": n["node_alias"],
                            "label": n["label"],
                            "sortorder": n["sortorder"],
                        }
                        for n in nodes
                    ]
                }

                NodeFilterConfig.objects.update_or_create(
                    graph_id=graph.graphid,
                    slug=document.get("slug", slug),
                    defaults={"config": config},
                )
                loaded += 1
                self.stdout.write(f"  {graph.slug:<32} {len(config['nodes']):4d} nodes")

        self.stdout.write(self.style.SUCCESS(f"\nloaded {loaded} config(s)"))

    def gaps(self, options):
        """Report what cannot render, aggregated by datatype."""
        slug = options["slug"]
        by_datatype = {}
        totals = {
            SUPPORT_RENDERABLE: 0,
            SUPPORT_BACKEND_ONLY: 0,
            SUPPORT_NONE: 0,
            SUPPORT_LARGE_LIST: 0,
        }

        for graph in self.graphs(options):
            path = self.path_for(graph.slug, slug)
            if not path.exists():
                continue
            for node in json.loads(path.read_text()).get("nodes", []):
                datatype = node.get("datatype", "?")
                support = node.get("support", SUPPORT_NONE)
                # Support varies *within* a datatype - a reference node backed by
                # a 9,635-item list is not in the same position as one backed by
                # 10 - so key on the pair, not the datatype alone.
                entry = by_datatype.setdefault(
                    (datatype, support), {"support": support, "count": 0}
                )
                entry["count"] += 1
                totals[support] = totals.get(support, 0) + 1

        self.stdout.write(f"{'datatype':<32}{'nodes':>8}  support")
        self.stdout.write("-" * 62)
        for (datatype, _), entry in sorted(
            by_datatype.items(), key=lambda kv: (-kv[1]["count"], kv[0])
        ):
            marker = {
                SUPPORT_RENDERABLE: self.style.SUCCESS("renderable"),
                SUPPORT_BACKEND_ONLY: self.style.WARNING("backend-only, needs widget"),
                SUPPORT_NONE: self.style.ERROR("unsupported"),
                SUPPORT_LARGE_LIST: self.style.ERROR("list too large for a dropdown"),
            }[entry["support"]]
            self.stdout.write(f"{datatype:<32}{entry['count']:>8}  {marker}")

        total = sum(totals.values()) or 1
        self.stdout.write("-" * 62)
        self.stdout.write(
            f"{'TOTAL':<32}{total:>8}  "
            f"{totals[SUPPORT_RENDERABLE]} renderable "
            f"({totals[SUPPORT_RENDERABLE] * 100 // total}%), "
            f"{totals[SUPPORT_BACKEND_ONLY]} need a widget, "
            f"{totals[SUPPORT_NONE]} unsupported"
        )

    def _counts(self, nodes):
        counts = {
            SUPPORT_RENDERABLE: 0,
            SUPPORT_BACKEND_ONLY: 0,
            SUPPORT_NONE: 0,
            SUPPORT_LARGE_LIST: 0,
        }
        for node in nodes:
            counts[node["support"]] += 1
        return counts

    # -- result cards ----------------------------------------------------

    def top_level_cards(self, graph):
        """Top-level cards and their data nodes, in display order."""
        cards = (
            models.CardModel.objects.filter(
                graph_id=graph.graphid, nodegroup__parentnodegroup__isnull=True
            )
            .select_related("nodegroup")
            .order_by("sortorder", "name")
        )
        for card in cards:
            grouping_node = models.Node.objects.filter(
                nodeid=card.nodegroup_id
            ).first()
            if grouping_node is None or not grouping_node.alias:
                continue
            if grouping_node.alias.endswith(EXCLUDE_NODEGROUP_SUFFIXES):
                continue
            
            hidden = models.CardXNodeXWidget.objects.filter(
                card_id=card.cardid, visible=False
            ).values_list("node_id", flat=True)

            queryset = (
                models.Node.objects.filter(nodegroup_id=card.nodegroup_id)
                .exclude(datatype__in=["semantic", "annotation"])
                .exclude(alias__isnull=True)
                .exclude(alias="")
                .exclude(nodeid__in=hidden)
                .order_by("sortorder", "alias")
            )
            for suffix in EXCLUDE_ALIAS_SUFFIXES:
                queryset = queryset.exclude(alias__endswith=suffix)
            aliases = list(queryset.values_list("alias", flat=True))
            if aliases:
                yield card, grouping_node.alias, aliases

    def generate_cards(self, options):
        CARD_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        written = 0

        for graph in self.graphs(options):
            path = CARD_CONFIG_DIR / f"{graph.slug}.json"
            if path.exists() and not options["overwrite"]:
                continue

            sections = [
                {
                    "component": DATA_SECTION_COMPONENT,
                    "config": {
                        "custom_card_name": str(card.name),
                        "nodegroup_alias": nodegroup_alias,
                        "node_aliases": aliases,
                    },
                }
                for card, nodegroup_alias, aliases in self.top_level_cards(graph)
            ]

            document = {
                "graph_slug": graph.slug,
                "graph_name": str(graph.name),
                "configs": {
                    # The card: descriptor name linking to the report, the
                    # description, and the lifecycle tag.
                    CARD_SLUG: {
                        "name": str(graph.name),
                        "theme": "default",
                        "components": [
                            {"component": DESCRIPTOR_COMPONENT, "config": {}}
                        ],
                    },
                    # The drop-down: one section per top-level card.
                    EXPANDED_SLUG: {
                        "name": str(graph.name),
                        "theme": "default",
                        "components": sections,
                    },
                },
            }
            path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n")
            written += 1
            columns = sum(
                len(section["config"]["node_aliases"]) for section in sections
            )
            self.stdout.write(
                f"  {graph.slug:<32} {len(sections):3d} expanded section(s), "
                f"{columns:4d} column(s)"
            )

        self.stdout.write(
            self.style.SUCCESS(f"\nwrote {written} file(s) to {CARD_CONFIG_DIR}")
        )

    def prune_sections(self, graph, config):
        """The expanded config with columns - then sections - that hold no data
        in this database removed.

        Fill rates are a property of an environment, not of the graph, so they
        are applied on the way in rather than baked into the repo file. The file
        stays the superset every environment starts from; each one hides what it
        has never used.
        """
        nodeids = dict(
            models.Node.objects.filter(graph_id=graph.graphid)
            .exclude(alias__isnull=True)
            .values_list("alias", "nodeid")
        )

        components = []
        for component in config.get("components", []):
            section = component.get("config", {})
            nodegroup_id = nodeids.get(section.get("nodegroup_alias"))
            if nodegroup_id is None:
                components.append(component)
                continue

            rows = [
                (alias, nodeids[alias])
                for alias in section.get("node_aliases", [])
                if alias in nodeids
            ]
            aliases = self.populated_aliases(nodegroup_id, rows)
            if aliases:
                components.append(
                    {**component, "config": {**section, "node_aliases": aliases}}
                )

        return {**config, "components": components}

    def load_cards(self, options):
        from arches_modular_reports.models import ReportConfig

        loaded = 0
        with transaction.atomic():
            for graph in self.graphs(options):
                path = CARD_CONFIG_DIR / f"{graph.slug}.json"
                if not path.exists():
                    continue
                document = json.loads(path.read_text())
                configs = document.get("configs", {})

                if options["prune_empty"] and EXPANDED_SLUG in configs:
                    before = configs[EXPANDED_SLUG]
                    after = self.prune_sections(graph, before)
                    configs = {**configs, EXPANDED_SLUG: after}
                    self.stdout.write(
                        f"  {graph.slug:<32} "
                        f"{self._columns(before):4d} -> {self._columns(after):4d} column(s), "
                        f"{len(before['components']):3d} -> "
                        f"{len(after['components']):3d} section(s)"
                    )

                for slug, config in configs.items():
                    ReportConfig.objects.update_or_create(
                        graph_id=graph.graphid, slug=slug, defaults={"config": config}
                    )
                    loaded += 1
        self.stdout.write(self.style.SUCCESS(f"loaded {loaded} report config(s)"))

    def _columns(self, config):
        return sum(
            len(component.get("config", {}).get("node_aliases", []))
            for component in config.get("components", [])
        )
