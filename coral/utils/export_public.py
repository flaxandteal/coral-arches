import time
import itertools
import os
import readline
import psycopg2
import shutil
from django.contrib.auth.models import User, Group as DjangoGroup
from arches.app.models.models import GraphModel

from arches.app.search.elasticsearch_dsl_builder import Query
from arches.app.utils.permission_backend import get_sets_for_user
from arches.app.search.elasticsearch_dsl_builder import Bool, Nested, Terms
from arches.app.search.mappings import RESOURCES_INDEX

from arches_orm.adapter import context_free
from arches_orm.models import Group, Person
from arches.app.utils.data_management.resources.exporter import ResourceExporter
from coral import settings

@context_free
def export_public(output_dir):
    from arches.app.search.search_engine_factory import SearchEngineInstance as _se

    pblc = Group.find("452ab9f2-ed4c-44dc-9ad3-ff9085734bc8")
    print(pblc)
    if not output_dir:
        print("No output directory specified, dry-run")

    def _print_group(group, depth = 0):
        for member in group.members:
            if isinstance(member, Group):
                print("IGNORING SUBGROUPS OF PUBLIC GROUP FOR SAFETY")
            elif isinstance(member, Person):
                print(" " * depth, "-", str(member))
            else:
                print(" " * depth, "?", str(member))

    _print_group(pblc)
    query = Query(se=_se)

    sets = get_sets_for_user(pblc, "view_resourceinstance")
    if not sets: # Only None if no filtering should be done, but may be an empty set.
        raise RuntimeError("The public group has no sets - stopping as this is not a useful constraint")

    bool_query = Bool()
    bool_query.must(Nested(path="sets", query=Terms(field="sets.id", terms=list(sets))))
    query.add_query(bool_query)

    import tabulate
    result_table = [
    ]

    graphs = {str(k): v for k, v in GraphModel.objects.values_list("graphid", "name")}
    seen_graph_ids = set()
    seen_resource_ids = set()

    cursor = 0
    total = 0
    for n in itertools.count():
        results = query.search(index=RESOURCES_INDEX, start=cursor)
        new_total = results["hits"]["total"]["value"]

        if new_total != total and total != 0:
            raise RuntimeError("Total changed during search!")
        total = new_total

        hits = len(results["hits"]["hits"])
        if hits < 1:
            raise RuntimeError("Check this - the number of hits is zero, but the total is larger!")

        cursor += hits
        for result in results["hits"]["hits"]:
            resource_id = result.get("_id")
            seen_resource_ids.add(resource_id)
            source = result.get("_source", {})
            graph_id = source.get("graph_id")
            graph_name = graphs[graph_id]
            seen_graph_ids.add(graph_id)
            display_names = sorted(source.get("displayname", []), key=lambda name: 0 if name.get("language", "en") else 1)
            display_name = display_names[0].get("value") if display_names else None
            result_table.append((str(graph_name), str(display_name), str(resource_id), n))

        if cursor >= total:
            break

    print("The following %d resources will be EXPOSED EXTERNALLY", results["hits"]["total"])
    result_table = sorted(result_table)
    print(tabulate.tabulate(result_table, headers=["Graph", "Name", "ID", "Query#"]))
    if output_dir:
        print("Exporting as JSON")
        export_business_data(output_dir, list(seen_graph_ids), list(seen_resource_ids))
        print("Exported")

def export_business_data(output_dir, graph_ids, resource_ids):
    output_dir = "/tmp"
    languages = None
    config_file = None
    file_format = "json"
    single_file = True
    # From Arches AGPL GCI
    if os.path.exists(output_dir):
        safe_characters = (" ", ".", "_", "-")
        for graphid in graph_ids:
            try:
                resource_exporter = ResourceExporter(
                    file_format, configs=config_file, single_file=single_file
                )  # New exporter needed for each graphid, else previous data is appended with each subsequent graph
                data = resource_exporter.export(graph_id=graphid, resourceinstanceids=None, languages=languages)
                for file in data:
                    with open(
                        os.path.join(
                            output_dir,
                            "".join(char if (char.isalnum() or char in safe_characters) else "-" for char in file["name"]).rstrip(),
                        ),
                        "w",
                    ) as f:
                        file["outputfile"].seek(0)
                        shutil.copyfileobj(file["outputfile"], f, 16 * 1024)
                    print("\t", file["name"], "written")
            except KeyError:
                print("{0} is not a valid export file format.".format(file_format))
    else:
        print(
            "The destination is unspecified or invalid. Please rerun this command with the '-d' parameter populated with a valid path."
        )

