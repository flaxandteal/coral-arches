define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/alert',
  'viewmodels/card-component',
  'utils/map-configurator',
  'utils/map-popup-provider',
  // 'viewmodels/map',
  'templates/views/components/workflows/merge-workflow/heritage-asset-map.htm'
], function (
  _,
  ko,
  koMapping,
  uuid,
  arches,
  AlertViewModel,
  CardComponentViewModel,
  mapConfigurator,
  mapPopupProvider,
  template
) {
  function viewModel(params) {
    const MapViewModel = require('viewmodels/map');

    this.loading = params.pageVm.loading;

    // const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    // params.multiple = false;
    // params.datatype = 'resource-instance';
    // params.configKeys = ['placeholder', 'defaultResourceInstance'];
    // params.graphids = params.graphIds;
    const self = this;
    self.geoFeature1 = {
      geometry: {
        coordinates: [
          [
            [0.10111520881363845, 51.62129502849737],
            [-0.04582692985923131, 51.61532631977448],
            [-0.027974146655282084, 51.53851583396113],
            [0.11347482795397923, 51.54364057193564],
            [0.10111520881363845, 51.62129502849737]
          ]
        ],
        type: 'Polygon'
      },
      id: 'e5e5d3dd384c4c2aa47b9b2ecadc3284',
      properties: { nodeId: '87d3d7dc-f44f-11eb-bee9-a87eeabdefba' },
      type: 'Feature'
    };

    self.geoPoint1 = {
      geometry: {
        coordinates: [-5.950716210511246, 54.60412993598476],
        type: 'Point'
      },
      id: '15ba290b0f69a057334bfa73223f361c',
      properties: { nodeId: '87d3d7dc-f44f-11eb-bee9-a87eeabdefba' },
      type: 'Feature'
    };

    console.log('heritage-asset-map params: ', params);

    this.MONUMENT_GEOMETRY_NODE_ID = '87d3d7dc-f44f-11eb-bee9-a87eeabdefba';

    // params.sources

    this.getGeometryTiles = async () => {
      console.log('get geom');

      // const layerId = 'resources-' + this.MONUMENT_GEOMETRY_NODE_ID;
      // const layerId = this.MONUMENT_GEOMETRY_NODE_ID;
      // const layerId = 'resource';
      // const geometries = {
      //   [layerId]: {
      //     type: 'geojson',
      //     data: {
      //       type: 'FeatureCollection',
      //       features: []
      //     }
      //   }
      // };
      const geometries = {};
      await Promise.all(
        [params.baseResourceId, params.mergeResourceId].map((resourceId) => {
          // const digitalObjectResourceId = ko.toJS(tile.data)[this.LETTER_RESOURCE_NODE][0]
          // .resourceId;
          if (!resourceId) return;
          return $.ajax({
            type: 'GET',
            url:
              arches.urls.root +
              `resource/${resourceId}/tiles?nodeid=${this.MONUMENT_GEOMETRY_NODE_ID}`,
            context: this,
            success: async (responseText, status, response) => {
              console.log(response.responseJSON);
              const resourceId = response.responseJSON.tiles[0].resourceinstance;
              const geometryData =
                response.responseJSON.tiles[0].data[this.MONUMENT_GEOMETRY_NODE_ID];
              console.log(geometryData);
              // geometries[resourceId] = {
              //   generateId: true,
              //   type: 'geojson',
              //   data: geometryData
              // };
              geometries[resourceId] = [];
              geometryData.features.forEach((feature) => {
                geometries[resourceId].push(feature);
                // geometries[layerId].data.features.push(feature);
              });
              // geometries.push(geometryData.features[0]);
            },
            error: (response, status, error) => {
              console.log(response);
              if (response.statusText !== 'abort') {
                this.viewModel.alert(
                  new AlertViewModel(
                    'ep-alert-red',
                    arches.requestFailed.title,
                    response.responseText
                  )
                );
              }
            }
          });
        })
      );
      console.log('geometries: ', geometries);

      return geometries;
    };

    MapViewModel.apply(self, [params]);

    this.setupMap = function (map) {
      console.log('this.setupMap: ', map);
      map.on('load', function () {
        console.log('this.setupMap load: ', map);

        require(['mapbox-gl', 'mapbox-gl-geocoder'], function (MapboxGl, MapboxGeocoder) {
          console.log('this.setupMap load after require: ', map);
          mapConfigurator.preConfig(map);
          map.addControl(new MapboxGl.NavigationControl(), 'top-left');
          map.addControl(
            new MapboxGl.FullscreenControl({
              container: $(map.getContainer()).closest('.workbench-card-wrapper')[0]
            }),
            'top-left'
          );
          map.addControl(
            new MapboxGeocoder({
              accessToken: MapboxGl.accessToken,
              mapboxgl: MapboxGl,
              placeholder: arches.geocoderPlaceHolder,
              bbox: arches.hexBinBounds
            }),
            'top-right'
          );

          self.layers.subscribe(self.updateLayers);

          var hoverFeature;

          map.on('mousemove', function (e) {
            var style = map.getStyle();
            if (hoverFeature && hoverFeature.id && style)
              map.setFeatureState(hoverFeature, { hover: false });
            hoverFeature = _.find(map.queryRenderedFeatures(e.point), (feature) =>
              mapPopupProvider.isFeatureClickable(feature, self)
            );
            if (hoverFeature && hoverFeature.id && style)
              map.setFeatureState(hoverFeature, { hover: true });

            map.getCanvas().style.cursor = hoverFeature ? 'pointer' : '';
            if (self.map().draw_mode) {
              var crosshairModes = ['draw_point', 'draw_line_string', 'draw_polygon'];
              map.getCanvas().style.cursor = crosshairModes.includes(self.map().draw_mode)
                ? 'crosshair'
                : '';
            }
          });

          map.draw_mode = null;

          map.on('click', function (e) {
            const popupFeatures = _.filter(map.queryRenderedFeatures(e.point), (feature) =>
              mapPopupProvider.isFeatureClickable(feature, self)
            );
            if (popupFeatures.length) {
              self.onFeatureClick(popupFeatures, e.lngLat, MapboxGl);
            }
          });

          map.on('zoomend', function () {
            console.log('this.setupMap zoomed: ', map);

            self.zoom(parseFloat(map.getZoom()));
          });

          map.on('dragend', function () {
            var center = map.getCenter();

            self.centerX(parseFloat(center.lng));
            self.centerY(parseFloat(center.lat));
          });

          var bounds = new MapboxGl.LngLatBounds();
          self.getGeometryTiles().then((geometries) => {
            Object.values(geometries).forEach((geometry, idx) => {
              let colour = '#0000FF';
              if (idx <= 0) colour = '#FF0000';
              geometry.forEach((geoJson, j) => {
                console.log('geometry: ', geoJson);

                if (geoJson.geometry.type === 'Point') {
                  bounds.extend(geoJson.geometry.coordinates);
                } else if (
                  geoJson.geometry.type === 'Polygon' ||
                  geoJson.geometry.type === 'MultiPolygon'
                ) {
                  geoJson.geometry.coordinates.forEach(function (polygon) {
                    polygon.forEach(function (coord) {
                      bounds.extend(coord);
                    });
                  });
                } else if (
                  geoJson.geometry.type === 'LineString' ||
                  geoJson.geometry.type === 'MultiLineString'
                ) {
                  geoJson.geometry.coordinates.forEach(function (coord) {
                    bounds.extend(coord);
                  });
                }

                map.addSource('myGeoJSON' + idx + j + 1, {
                  type: 'geojson',
                  data: geoJson
                });
                map.addLayer({
                  id: 'myGeoJSON-polygon-layer' + idx + j + 1,
                  type: 'fill',
                  source: 'myGeoJSON' + idx + j + 1,
                  'source-layer': '',
                  paint: {
                    'fill-color': colour,
                    'fill-opacity': 0.5
                  },
                  filter: ['==', '$type', 'Polygon']
                });
                map.addLayer({
                  id: 'myGeoJSON-circle-layer' + idx + j + 1,
                  type: 'circle',
                  source: 'myGeoJSON' + idx + j + 1,
                  'source-layer': '',
                  paint: {
                    'circle-color': colour,
                    'circle-radius': 6,
                    'circle-opacity': 0.5
                  },
                  filter: ['==', '$type', 'Point']
                });
                map.addLayer({
                  id: 'myGeoJSON-line-layer' + idx + j + 1,
                  type: 'line',
                  source: 'myGeoJSON' + idx + j + 1,
                  'source-layer': '',
                  paint: {
                    'line-color': colour,
                    'line-width': 2,
                    'line-opacity': 0.5
                  },
                  filter: ['==', '$type', 'LineString']
                });
                
                map.fitBounds(bounds, { padding: 20 });
              });
            });
          });

          console.log('bounds: ', bounds);

          mapConfigurator.postConfig(map);
          self.map(map);

          console.log('mapppppppppp: ', map);
        });
      });
    };

    console.log('heritage-asset-map: ', self);

    // require(['mapbox-gl', 'mapbox-gl-geocoder'], function (MapboxGl, MapboxGeocoder) {
    //   const marker = new MapboxGl.Marker()
    //     .setLngLat([-5.950716210511246, 54.60412993598476]) // Replace with your desired marker coordinates
    //     .addTo(self.map());
    // });

    // self.initialize = () => {
    //   self.map().addSource('feature-1', self.geoFeature1);
    // };

    // self.initialize();

    // self.map().on('load', () => {
    //   self.map().addSource('feature-1', {
    //     type: 'geojson',
    //     data: self.geoFeature1
    //   });
    //   self.map().addSource('point-1', {
    //     type: 'geojson',
    //     data: self.geoPoint1
    //   });
    //   self.map().addLayer({
    //     id: 'point-1',
    //     type: 'fill',
    //     source: 'point-1', // reference the data source
    //     layout: {},
    //     paint: {
    //       'fill-color': '#0080ff', // blue color fill
    //       'fill-opacity': 0.5
    //     }
    //   });
    //   // Add a black outline around the polygon.
    //   self.map().addLayer({
    //     id: 'outline',
    //     type: 'line',
    //     source: 'point-1',
    //     layout: {},
    //     paint: {
    //       'line-color': '#000',
    //       'line-width': 3
    //     }
    //   });
    // });
  }

  ko.components.register('heritage-asset-map', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
