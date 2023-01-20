import json
import csv
import sys

def update_mapping(filename, filename_out):
    models = {}
    with open(filename, "r") as fd:
        reader = csv.DictReader(fd)
        for row in reader:
            if row["map_name_arches"]:
                models[row["map_name_arches"]] = {
                    "lang": row.get("Language", "en"),
                    "type": row.get("Type", "str") or "str",
                    "nodeid": row["node_id"],
                    "nodegroupid": row["node_group_id"],
                }
    with open(filename_out, "w") as fd:
        models["graphid"] = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
        json.dump({
            "Monument": models
        }, fd)

mapping_types_standardization = {
    "str": "str",
    "integer": "int",
    "int": "int",
    "text": "str",
    "concept": "concept",
    "date": "date",
    "datetime": "datetime",
    "text": "str",
    "dropdown": "concept",
    "[concept]": "[concept]",
    "option select": "concept",
}

def update_mapping_new(filename, filename_out):
    models = {}
    with open(filename, "r") as fd:
        reader = csv.DictReader(fd)
        for row in reader:
            if row["type"] not in mapping_types_standardization:
                print("Missing", row["type"])
                continue
            if row["map_name_arches"]:
                typ = row["type"]
                models[row["map_name_arches"]] = {
                    "lang": row.get("Language", "en"),
                    "type": mapping_types_standardization[typ],
                    "nodeid": row["nodeid"],
                    "nodegroupid": row["nodegroup_id"],
                }
    with open(filename_out, "w") as fd:
        models["graphid"] = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
        json.dump({
            "Monument": models
        }, fd)

if __name__ == "__main__":
    update_mapping_new(sys.argv[1], sys.argv[2])
