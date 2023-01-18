import json
import csv

models = {}
with open("docker/mapping_file.csv", "r") as fd:
    reader = csv.DictReader(fd)
    for row in reader:
        if row["map_name_arches"]:
            models[row["map_name_arches"]] = {
                "lang": row.get("Language", "en"),
                "type": row.get("Type", "str") or "str",
                "nodeid": row["node_id"],
                "nodegroupid": row["node_group_id"],
            }
with open("docker/mapping_file.json", "w") as fd:
    models["graphid"] = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
    json.dump({
        "Monument": models
    }, fd)
