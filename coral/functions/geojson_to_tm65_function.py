import uuid
from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.contrib.gis.geos import GEOSGeometry
import json
from datetime import datetime


details = {
    "name": "GeoJSON to TM65 Point",
    "type": "node",
    "description": "Pushes the geometry from a GeoJSON node's centroid to a related TM65 Point node",
    "defaultconfig": {
        "geojson_input_node": "",
        "tm65_output_node": "",
        "geojson_input_nodegroup": "",
        "tm65_output_nodegroup": "",
        "triggering_nodegroups": [],
    },
    "classname": "GeoJSONToTM65Point",
    "component": "views/components/functions/geojson-to-tm65-function",
    "functionid": "561abd7c-69ab-4240-ae5b-d12b11d4ec91",
}


class GeoJSONToTM65Point(BaseFunction):
    def get(self):
        raise NotImplementedError

    def save_tm65point(self, tile, request, is_function_save_method=True):
        """Finds the TM65 Alphanumeric value for the centroid of the envelope(extent) of the Geometry,
        and saves that value to the tm65_output_nodegroup of the tile.

        Args:
            self: GeoJSONToTM65Point object.

            tile: Tile to attach / amend tm65_output_nodegroup of.

            request: WSGI Request used to varify call is result of user action. N.B. Function Returns if empty.

            is_function_save_method: a bool stating whether the function calling it is the save function.
        """
        # First let's check if this call is as a result of an inbound request (user action) or
        # as a result of the complementary TM65PointToGeoJSON function saving a new GeoJson.
        if request is None and is_function_save_method == True:
            return
        
        srid_LatLong = 4326
        srid_BngAbs = 29902
        # Reference grid for Easting/Northing to TM65 Alphas.

        os_grid = {
            "04": "A",
            "14": "B",
            "24": "C",
            "34": "D",
            "44": "E",
            "03": "F",
            "13": "G",
            "23": "H",
            "33": "J",
            "43": "K",
            "02": "L",
            "12": "M",
            "22": "N",
            "32": "O",
            "42": "P",
            "01": "Q",
            "11": "R",
            "21": "S",
            "31": "T",
            "41": "U",
            "00": "V",
            "10": "W",
            "20": "X",
            "30": "Y",
            "40": "Z"
        }

        geojsonnode = self.config["geojson_input_node"]
        tm65node = self.config["tm65_output_node"]
        tm65nodegroup = self.config["tm65_output_nodegroup"]
        # if not tile.data[geojsonnode] :
        #     return
        try: 
            geojsonValue = tile.data[geojsonnode]
        except:
            return

        if geojsonValue != None:


            # Grab a copy of the Geometry collection.
            geoJsFeatures = geojsonValue["features"]

            # Get the first feature as a GeosGeometry.
            geosGeom_union = GEOSGeometry(json.dumps(geoJsFeatures[0]["geometry"]))

            # update list.
            geoJsFeatures = geoJsFeatures[1:]

            # loop through list of geoJsFeatures.
            for item in geoJsFeatures:
                # .union seems to generate 'GEOS_ERROR: IllegalArgumentException:'
                # exceptions, but they seem spurious and are automatically ignored.
                geosGeom_union = geosGeom_union.union(GEOSGeometry(json.dumps(item["geometry"])))

            # find the centroid of the envelope for the resultant Geometry Collection.
            centroidPoint = geosGeom_union.envelope.centroid

            # Explicitly declare the SRID for the current lat/long.
            centroidPoint = GEOSGeometry(centroidPoint, srid=srid_LatLong)

            # Transform to Absolute TM65.
            centroidPoint.transform(srid_BngAbs, False)

            # Get initial Easting and Northing digits. N.B. Left Zero pad integer coords to 6 digits!
            easting = str(int(centroidPoint.coords[0])).zfill(6)
            northing = str(int(centroidPoint.coords[1])).zfill(6)
            gridref = easting[0] + northing[0]

            # Get AlphaNumeric TM65
            try:
                gridref = os_grid[gridref] + easting[1:6] + northing[1:6]
            except KeyError:
                raise Exception("Conversion Error : Coordinates outside of TM65 grid range.")

            if self.config["tm65_output_nodegroup"] == str(tile.nodegroup_id):
                tile.data[tm65node] = gridref
            else:

                previously_saved_tiles = Tile.objects.filter(
                    nodegroup_id=self.config["tm65_output_nodegroup"], resourceinstance_id=tile.resourceinstance_id
                )
                # Update pre-existing tiles, or Create new one.
                if len(previously_saved_tiles) > 0:
                    for p in previously_saved_tiles:
                        p.data[tm65node] = gridref
                        p.save()
                else:
                    new_tm65_tile = Tile().get_blank_tile_from_nodegroup_id(
                        self.config["tm65_output_nodegroup"], resourceid=tile.resourceinstance_id, parenttile=tile.parenttile
                    )
                    new_tm65_tile.data[tm65node] = gridref
                    new_tm65_tile.save()

            return
        return

    def save(self, tile, request, context=None):


        self.save_tm65point(tile=tile, request=request, is_function_save_method=True)
        return

    def post_save(self, *args, **kwargs):
        raise NotImplementedError

    def delete(self, tile, request):
        raise NotImplementedError

    def on_import(self, tile):
        self.save_tm65point(tile=tile, request=None, is_function_save_method=False)
        return

    def after_function_save(self, tile, request):
        raise NotImplementedError
