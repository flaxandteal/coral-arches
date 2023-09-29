import uuid
from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.contrib.gis.geos import GEOSGeometry
import json, math
from datetime import datetime

"""
            ALL FEATURES [
                {
                    'id': 'b67ae23acad7c0f155c7e8ba0d305779',
                    'type': 'Feature',
                    'properties': {'nodeId': 'a5419248-f121-11eb-86a9-a87eeabdefba'},
                    'geometry': {'coordinates': [
                        [
                            [-0.19380618236272085, 51.51135933879806],
                            [-0.06516734698570303, 51.470749470606165],
                            [-0.1293032284257265, 51.45137062382233],
                            [-0.19380618236272085, 51.51135933879806]
                        ]
                    ],
                    'type': 'Polygon'}
                }, 
                {
                    'id': '34d600919cd1c2adf1886029fc83272f',
                    'type': 'Feature',
                    'properties': {'nodeId': 'a5419248-f121-11eb-86a9-a87eeabdefba'},
                    'geometry': {'coordinates': [
                        [-0.12775079378462806, 51.39229088149753],
                        [-0.20408711826283366, 51.40479213572527],
                        [-0.1795283686202822, 51.43607142655139]
                    ],
                    'type': 'LineString'}}]
            """
details = {
    "name": "GeoJSON to UTM Point",
    "type": "node",
    "description": "Pushes the geometry from a GeoJSON node's centroid to a related UTM Point node",
    "defaultconfig": {
        "geojson_input_node": "",
        "utm_output_node": "",
        "geojson_input_nodegroup": "",
        "utm_output_nodegroup": "",
        "triggering_nodegroups": [],
    },
    "classname": "GeoJSONToUTMPoint",
    "component": "views/components/functions/geojson-to-utm-function",
    "functionid": "317a318b-792b-4de3-bea9-e4212850431f",
}

ZONE_LETTERS = "CDEFGHJKLMNPQRSTUVWXX"

R = 6378137
"""Radius of the earth in meters"""

K0 = 0.9996
"""Scale Factor:
a unitless value applied to the center point or line of a map projection.
The scale factor is usually slightly less than one. The Universal Transverse Mercator (UTM) coordinate system, which uses the Transverse Mercator projection, has a scale factor of 0.9996. Rather than 1.0, the scale along the central meridian of the projection is 0.9996. This creates two almost parallel lines approximately 180 kilometers, or about 1°, away where the scale is 1.0. The scale factor reduces the overall distortion of the projection in the area of interest.
[3]_
"""

E = 0.00669438
"""Eccentricity :  
the eccentricity of an astronomical orbit used as a measure of its deviation from circularity.
[4]_
The formula is:
e^2 = (a^2 - b^2) / a = 2f - f^2 
So apparently this makes the parameters for the  World Geodetic System (WGS) 84 ellipsoid:
WGS 84 Parameter    |   Value
--------------------+--------------------
Semi-major axis, a  |   6,378,137 meters
Semi-minor axis, b  |   6,356,752 meters
Flattening, f       |   1 / 298.257223563
Eccentricity, e     |   0.00669438
[5]_
"""
E2 = E * E
E3 = E2 * E
E_P2 = E / (1 - E)

# I haven't a clue
M1 = (1 - E / 4 - 3 * E2 / 64 - 5 * E3 / 256)
M2 = (3 * E / 8 + 3 * E2 / 32 + 45 * E3 / 1024)
M3 = (15 * E2 / 256 + 45 * E3 / 1024)
M4 = (35 * E3 / 3072)

class GeoJSONToUTMPoint(BaseFunction):
    def get(self):
        raise NotImplementedError

    
    def save_utmpoint(self, tile, request, is_function_save_method=True):
        """Finds the UTM Alphanumeric value for the centroid of the envelope(extent) of the Geometry,
        and saves that value to the utm_output_nodegroup of the tile.

        Args:
            self: GeoJSONToUTMPoint object.

            tile: Tile to attach / amend utm_output_nodegroup of.

            request: WSGI Request used to varify call is result of user action. N.B. Function Returns if empty.

            is_function_save_method: a bool stating whether the function calling it is the save function.
        """
        geojsonnode = self.config["geojson_input_node"]
        utmnode = self.config["utm_output_node"]
        utmnodegroup = self.config["utm_output_nodegroup"]
        if geojsonnode in tile.data.keys():
            geojsonValue = tile.data[geojsonnode]
        else:
            geojsonValue = None

        utmrefs = []

        if geojsonValue != None:
            # Grab a copy of the Geometry collection.
            geoJsFeatures = geojsonValue["features"]

            geometries = list(map(lambda x: x['geometry'], geoJsFeatures))
            
            for geo in geometries:
                if geo['type'] == 'Point':
                    utmrefs.append(self.from_latlon(geo['coordinates'][0], geo['coordinates'][1]))
                elif geo['type'] == 'LineString':
                    for plot in geo['coordinates']:
                        utmrefs.append(self.from_latlon(plot[0], plot[1]))
                elif geo['type'] == 'Polygon':
                    for coor in geo['coordinates']:
                        for plot in coor:
                            utmrefs.append(self.from_latlon(plot[0], plot[1]))
                        center_lat = sum(list(map(lambda x : x[0], coor))) / len(coor)
                        center_lon = sum(list(map(lambda x : x[1], coor))) / len(coor)
                        utmrefs.append(self.from_latlon(center_lat,center_lon))
                        

            utmreftile = Tile.objects.filter(nodegroup_id=utmnodegroup, resourceinstance_id=tile.resourceinstance_id
                                           ).values_list()
            
            if len(utmreftile) == 0:
                Tile.objects.get_or_create(
                resourceinstance_id=tile.resourceinstance_id,
                nodegroup_id=utmnodegroup,
                parenttile = tile.parenttile,
                data={
                    utmnode: {'en': {
                        'direction': 'ltr',
                        'value': str(utmrefs)
                    }}
                }
            )
            else:
                tileid = Tile.objects.filter(nodegroup_id=utmnodegroup, resourceinstance_id=tile.resourceinstance_id
                                             ).first().tileid
                Tile.update_node_value(utmnode, {'en': {
                            'direction': 'ltr',
                            'value': str(utmrefs)
                        }}, tileid)



        """
        {
           "type": "FeatureCollection",
           "features": [
              {
                 "id": "13b621e4061902e75620003d58353ecb",
                 "type": "Feature",
                 "properties": {
                    "nodeId": "a5419248-f121-11eb-86a9-a87eeabdefba"
                 },
                 "geometry": {
                    "coordinates": [
                       -0.07570315501922664,
                       51.45990702110373
                    ],
                    "type": "Point"
                 }
              },
              {
                 "id": "383e5cd00fb61254db67292aa696b275",
                 "type": "Feature",
                 "properties": {
                    "nodeId": "a5419248-f121-11eb-86a9-a87eeabdefba"
                 },
                 "geometry": {
                    "coordinates": [
                       [
                          [
                             -0.06471682689735303,
                             51.45306134291113
                          ],
                          [
                             -0.07982302806939856,
                             51.43166198094548
                          ],
                          [
                             -0.041370879632495416,
                             51.42138672536154
                          ],
                          [
                             -0.020771514397637247,
                             51.42909338366141
                          ],
                          [
                             -0.06471682689735303,
                             51.45306134291113
                          ]
                       ]
                    ],
                    "type": "Polygon"
                 }
              },
              {
                 "id": "d59e244d0106e19eb2df389ffea6a890",
                 "type": "Feature",
                 "properties": {
                    "nodeId": "a5419248-f121-11eb-86a9-a87eeabdefba"
                 },
                 "geometry": {
                    "coordinates": [
                       [
                          -0.13887454174113145,
                          51.44107893555892
                       ],
                       [
                          -0.02351809642860303,
                          51.459907021106005
                       ]
                    ],
                    "type": "LineString"
                 }
              }
           ]
        }
        """


    def mod_angle(self, value):
        """Returns angle in radians to be between -pi and pi"""
        return (value + math.pi) % (2 * math.pi) - math.pi



    def latitude_to_zone_letter(self, latitude):
        if -80 <= latitude <= 84:
            return ZONE_LETTERS[int(latitude + 80) >> 3]
        else:
            return None

    def latlon_to_zone_number(self, latitude, longitude):
        if 56 <= latitude < 64 and 3 <= longitude < 12:
            return 32
        if 72 <= latitude <= 84 and longitude >= 0:
            if longitude < 9:
                return 31
            elif longitude < 21:
                return 33
            elif longitude < 33:
                return 35
            elif longitude < 42:
                return 37
        return int((longitude + 180) / 6) + 1
    
    def zone_number_to_central_longitude(self, zone_number):
        return (zone_number - 1) * 6 - 180 + 3


    def from_latlon(self, latitude, longitude):
        """This function converts Latitude and Longitude to UTM coordinate
    
            Parameters
            ----------
            latitude: float
                Latitude between 80 deg S and 84 deg N, e.g. (-80.0 to 84.0)
    
            longitude: float
                Longitude between 180 deg W and 180 deg E, e.g. (-180.0 to 180.0).
    
            Returns
            -------
            easting: float
                Easting value of UTM coordinates
    
            northing: float
                Northing value of UTM coordinates
    
            zone_number: int
                Zone number is represented by global map numbers of a UTM zone
                numbers map. More information see utmzones [3]_
    
            zone_letter: str
                Zone letter is represented by a string value. UTM zone designators
                can be accessed in [3]_
    
        """
        lat_rad = math.radians(latitude)
        lat_sin = math.sin(lat_rad)
        lat_cos = math.cos(lat_rad)
    
        lat_tan = lat_sin / lat_cos
        lat_tan2 = lat_tan * lat_tan
        lat_tan4 = lat_tan2 * lat_tan2
    
        zone_number = self.latlon_to_zone_number(latitude, longitude)
        zone_letter = self.latitude_to_zone_letter(latitude)
    
        lon_rad = math.radians(longitude)
        central_lon = self.zone_number_to_central_longitude(zone_number)
        central_lon_rad = math.radians(central_lon)
    
        n = R / math.sqrt(1 - E * lat_sin**2)
        c = E_P2 * lat_cos**2
    
        a = lat_cos * self.mod_angle(lon_rad - central_lon_rad)
        a2 = a * a
        a3 = a2 * a
        a4 = a3 * a
        a5 = a4 * a
        a6 = a5 * a
    
        m = R * (M1 * lat_rad -
                 M2 * math.sin(2 * lat_rad) +
                 M3 * math.sin(4 * lat_rad) -
                 M4 * math.sin(6 * lat_rad))
        
        easting = K0 * n * (a +
                            a3 / 6 * (1 - lat_tan2 + c) +
                            a5 / 120 * (5 - 18 * lat_tan2 + lat_tan4 + 72 * c - 58 * E_P2)) + 500000
    
        northing = K0 * (m + n * lat_tan * (a2 / 2 +
                                            a4 / 24 * (5 - lat_tan2 + 9 * c + 4 * c**2) +
                                            a6 / 720 * (61 - 58 * lat_tan2 + lat_tan4 + 600 * c - 330 * E_P2)))
    
        if latitude < 0:
            northing += 10000000

        return f"{zone_number}{zone_letter} {easting}mE, {northing}mN"
        # return easting, northing, zone_number, zone_letter
    
    def save(self, tile, request, context=None):
        self.save_utmpoint(tile=tile, request=request, is_function_save_method=True)
        return

    def post_save(self, *args, **kwargs):
        raise NotImplementedError

    def delete(self, tile, request):

        raise NotImplementedError

    def on_import(self, tile):

        self.save_utmpoint(tile=tile, request=None, is_function_save_method=False)
        return

    def after_function_save(self, tile, request):

        raise NotImplementedError
