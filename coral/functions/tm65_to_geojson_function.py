import uuid
from arches.app.functions.base import BaseFunction
from arches.app.models.system_settings import settings
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.contrib.gis.geos import GEOSGeometry
from django.db import connection, transaction
import json
from datetime import datetime


details = {
    "name": "TM65 Point to GeoJSON",
    "type": "node",
    "description": "Pushes the geometry from a TM65 Point node to a related GeoJSON node",
    "defaultconfig": {"tm65_node": "", "geojson_node": "", "tm65_nodegroup": "", "geojson_nodegroup": "", "triggering_nodegroups": []},
    "classname": "TM65PointToGeoJSON",
    "component": "views/components/functions/tm65point-to-geojson-function",
    "functionid": "e83afc88-4c6a-40f1-9490-55c62b2912c2"
}


class TM65PointToGeoJSON(BaseFunction):
    def get(self):
        raise NotImplementedError

    def save_geojson(self, tile, request, is_function_save_method=True):
        """Finds the equivalen GeoJSON for a TM65 Alphanumeric value and saves that value to the
        geojson nodegroup of the tile.

        Args:
            self : TM65PointToGeoJSON object.

            tile : Tile to attach / amend geojson_nodegroup of.

            request : WSGI Request used to varify call is result of user action. N.B. Function Returns if empty.

            is_function_save_method : a bool stating whether the function calling it is the save function.
        """

        # First let's check if this call is as a result of an inbound request (user action) or
        # as a result of the complementary GeoJSONToTM65Point function saving a new BngPoint.
        if request is None and is_function_save_method == True:
            return

        tm65ValueReturned = ""
        gridSquare = {
            "A" : [0,4],
            "B" : [1,4],
            "C" : [2,4],
            "D" : [3,4],
            "E" : [4,4],
            "F" : [0,3],
            "G" : [1,3],
            "H" : [2,3],
            "J" : [3,3],
            "K" : [4,3],
            "L" : [0,2],
            "M" : [1,2],
            "N" : [2,2],
            "O" : [3,2],
            "P" : [4,2],
            "Q" : [0,1],
            "R" : [1,1],
            "S" : [2,1],
            "T" : [3,1],
            "U" : [4,1],
            "V" : [0,0],
            "W" : [1,0],
            "X" : [2,0],
            "Y" : [3,0],
            "Z" : [4,0]
        }

        tm65node = self.config["tm65_node"]
        geojsonNode = self.config["geojson_node"]
        tm65ValueReturned = tile.data[tm65node]

        if tm65ValueReturned != None:
            """
            The following section turns the alphanumberic TM65 value in the tile into a point geometry object and then transforms that object
            into WGS 1984 long/lat projection system.
            """

            dt = datetime.now()
            gridSquareLetters = tm65ValueReturned[0:1]
            tm65ValueNumbers = tm65ValueReturned[1:]
            splitSection = int(len(tm65ValueNumbers) / 2)
            gridSquareNumbers = gridSquare[gridSquareLetters]
            eastingValue = str(gridSquareNumbers[0]) + str(tm65ValueNumbers[:splitSection])
            northingValue = str(gridSquareNumbers[1]) + str(tm65ValueNumbers[splitSection:])
            osgb36PointString = "POINT (" + eastingValue + " " + northingValue + ")"
            osgb36Point = GEOSGeometry(osgb36PointString, srid=29902)
            osgb36Point.transform(4326, False)
            pointGeoJSON = json.loads(osgb36Point.geojson)

            """
                This section creates a geojson object required in the format required by Arches.  The date and time the object was
                created has also been added in the feature's properties.
            """

            uuidForRecord = uuid.uuid4().hex
            tm65Feature = {
                "geometry": pointGeoJSON,
                "type": "Feature",
                "id": str(uuidForRecord),
                "properties": {"datetime": dt.strftime("%d/%m/%Y %H:%M:%S"), "tm65ref": str(tm65ValueReturned)},
            }

            geometryValue = {"type": "FeatureCollection", "features": [tm65Feature]}

            geometryValueJson = geometryValue

            """
            The Tile.objects.filter function from tiles.py is called to return any tiles with the geojson_nodegroup value
            as the nodegroup_id and the current tile's resource instance ID as its resourceinstance_id value; any tiles returned
            are added to the previously_saved_tiles variable.

            If there are tiles returned then the new geojson object overwrites the current value.

            If there are no tiles returned, a new tile is created for the geojson nodegroup using tile.py's get_blank_tile
            function.  If there is a key within the data object in the new node with the same id as the geojson_nodegroup value
            then that key/value pair are deleted.  The geojson object is set at the value to the key which has the value of the geojson_node
            value.

            The new tile is saved and then the mv_geojson_geoms materialised view is refreshed so the point geometry will be displayed
            on the Search map.
            """
            if self.config["geojson_nodegroup"] == str(tile.nodegroup_id):
                tile.data[geojsonNode] = geometryValueJson
            else:
                previously_saved_tiles = Tile.objects.filter(
                    nodegroup_id=self.config["geojson_nodegroup"], resourceinstance_id=tile.resourceinstance_id
                )

                if len(previously_saved_tiles) > 0:
                    for p in previously_saved_tiles:
                        old_geojson = p.data[geojsonNode]
                        p.data[geojsonNode] = geometryValueJson

                        for f in old_geojson["features"]:
                            if "tm65ref" not in f["properties"]:
                                p.data[geojsonNode]["features"].append(f)

                        p.save()
                else:
                    new_geojson_tile = Tile().get_blank_tile_from_nodegroup_id(
                        self.config["geojson_nodegroup"], resourceid=tile.resourceinstance_id, parenttile=tile.parenttile
                    )
                    new_geojson_tile.data[self.config["geojson_node"]] = geometryValueJson

                    if self.config["geojson_nodegroup"] in new_geojson_tile.data:
                        del new_geojson_tile.data[self.config["geojson_nodegroup"]]

                    new_geojson_tile.save()

            cursor = connection.cursor()
            sql = """
                    SELECT * FROM refresh_geojson_geometries();
                """
            cursor.execute(sql)  #

        else:
            pass

        return

    def save(self, tile, request, context=None):

        self.save_geojson(tile=tile, request=request, is_function_save_method=True)
        return

    def post_save(self, *args, **kwargs):
        raise NotImplementedError

    def delete(self, tile, request):
        raise NotImplementedError

    def on_import(self, tile):
        self.save_geojson(tile=tile, request=None, is_function_save_method=False)
        return

    def after_function_save(self, tile, request):
        raise NotImplementedError
