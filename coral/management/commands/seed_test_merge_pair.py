import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.test import RequestFactory

from arches.app.models.models import Node
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

from coral.management.commands.seed_test_issue_report import (
    HA_SYSTEM_REFERENCE_NODEGROUP,
    HA_SYSTEM_REFERENCE_NUMBER_NODE,
    HERITAGE_ASSET_GRAPH,
)
from coral.utils.test_seed_guard import require_test_environment

NAME_NODEGROUP = "676d47f9-9c1c-11ea-9aa0-f875a44e0e11"
NAME_NODE = "676d47ff-9c1c-11ea-b07f-f875a44e0e11"

LOCATION_DATA_NODEGROUP = "87d39b2e-f44f-11eb-9a4a-a87eeabdefba"
GEOMETRY_NODEGROUP = "87d3872b-f44f-11eb-bd0c-a87eeabdefba"
GEOMETRY_NODE = "87d3d7dc-f44f-11eb-bee9-a87eeabdefba"
ADDRESSES_NODEGROUP = "87d39b25-f44f-11eb-95e5-a87eeabdefba"
FULL_ADDRESS_NODE = "87d39b36-f44f-11eb-a905-a87eeabdefba"
BUILDING_NAME_NODE = "87d3ff27-f44f-11eb-a92b-a87eeabdefba"
STREET_NODE = "87d39b4b-f44f-11eb-80ef-a87eeabdefba"
TOWN_OR_CITY_NODE = "87d3ff21-f44f-11eb-9ce9-a87eeabdefba"
POSTCODE_NODE = "87d3ff23-f44f-11eb-ad2f-a87eeabdefba"

# (key, HA Number, site name, (lon, lat), (building, street, town, postcode)).
# A merge consumes both, so each run starts them afresh. Two separate Belfast sites,
# so the merge map shows two shapes.
PAIR = (
    ("base", "HA/90", "Merge Test Base", (-5.9301, 54.5965),
     ("Merge Test Base House", "1 Test Street", "Belfast", "BT1 1AA")),
    ("other", "HA/91", "Merge Test Other", (-5.9200, 54.6000),
     ("Merge Test Other Hall", "2 Sample Road", "Belfast", "BT2 2BB")),
)


def text(value):
    return {"en": {"value": value, "direction": "ltr"}}


def square(lon, lat, half=0.0005):
    ring = [[lon - half, lat - half], [lon + half, lat - half], [lon + half, lat + half],
            [lon - half, lat + half], [lon - half, lat - half]]
    return {
        "type": "FeatureCollection",
        "features": [{"type": "Feature", "id": str(uuid.uuid4()), "properties": {},
                      "geometry": {"type": "Polygon", "coordinates": [ring]}}],
    }


class Command(BaseCommand):
    help = (
        "Recreate two throwaway Heritage Assets (HA/90 Merge Test Base, HA/91 Merge Test "
        "Other) for the Merge workflow spec to merge. Any earlier copies are deleted first. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def handle(self, *args, **options):
        require_test_environment("seed_test_merge_pair")

        # Tile post-save functions dereference request.user, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        for key, ha_number, site_name, (lon, lat), (building, street, town, postcode) in PAIR:
            resource_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"coral-e2e:merge-{key}"))
            for existing in Resource.objects.filter(pk=resource_id):
                existing.delete(user=request.user)

            Resource(resourceinstanceid=resource_id, graph_id=HERITAGE_ASSET_GRAPH).save(request=request)
            self._tile(resource_id, HA_SYSTEM_REFERENCE_NODEGROUP,
                       {HA_SYSTEM_REFERENCE_NUMBER_NODE: text(ha_number)}, request)
            self._tile(resource_id, NAME_NODEGROUP, {NAME_NODE: text(site_name)}, request)
            location = self._tile(resource_id, LOCATION_DATA_NODEGROUP, {}, request)
            self._tile(resource_id, GEOMETRY_NODEGROUP, {GEOMETRY_NODE: square(lon, lat)}, request,
                       parent=location)
            self._tile(resource_id, ADDRESSES_NODEGROUP, {
                BUILDING_NAME_NODE: text(building),
                STREET_NODE: text(street),
                TOWN_OR_CITY_NODE: text(town),
                POSTCODE_NODE: text(postcode),
                FULL_ADDRESS_NODE: text(f"{building}, {street}, {town} {postcode}"),
            }, request, parent=location)
            # The workflow pickers search Elasticsearch.
            Resource.objects.get(pk=resource_id).index()
            self.stdout.write(self.style.SUCCESS(f"Seeded {ha_number} {site_name} ({resource_id})"))

    def _tile(self, resource_id, nodegroup_id, values, request, parent=None):
        data = {
            str(node.pk): None
            for node in Node.objects.filter(nodegroup_id=nodegroup_id).exclude(datatype="semantic")
        }
        data.update(values)
        tile = Tile(tileid=uuid.uuid4(), resourceinstance_id=resource_id, nodegroup_id=nodegroup_id,
                    parenttile=parent, data=data)
        tile.save(request=request)
        # save() leaves geojson_geometries (the map layers) alone; the tile API calls this too.
        tile.after_update_all()
        return tile
