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
    'templates/views/components/workflows/assign-consultation-workflow/heritage-asset-map.htm'
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

      console.log("Heriatge asset workflow map func init");
  
      this.loading = params.pageVm.loading;
  
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
  
      this.RELATED_HERITAGE_NODE_ID = 'bc64746e-cf4a-11ef-997c-0242ac120007';
      this.GEO_NODE_ID = "87d3872b-f44f-11eb-bd0c-a87eeabdefba";
  
      this.getGeometryTiles = async () => {
        const geometries = {};

        await Promise.all(
          [params.baseResourceId].map((resourceId) => {
            if (!resourceId) return;
            return $.ajax({
              type: 'GET',
              url:
                arches.urls.root +
                `resource/${resourceId}/tiles?nodeid=${this.RELATED_HERITAGE_NODE_ID}`,
              context: this,
              success: async (responseText, status, response) => {
                const tiles =
                  response.responseJSON.tiles[0].data[this.RELATED_HERITAGE_NODE_ID];
                
                tilesArray = [];
                tiles.forEach((tile) => {
                  tilesArray.push(tile);
                });
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

        tilesArray.forEach((tile, idx) => {
          geometries[idx] = getGeoJsonData(tile.resourceId);

          console.log("foreach", geometries);
        });

          console.log("Geoms print" + geometries);
          return geometries;
      };

      const getGeoJsonData = (resourceId) => {
        const returnFeature = {};

        $.ajax({
          type: 'GET',
              url:
                arches.urls.root +
                `resource/${resourceId}/tiles?nodeid=${this.GEO_NODE_ID}`,
              context: this,
              success: async (responseText, status, response) => {

                let filteredResponseData = response.responseJSON.tiles[0].display_values['1'].value;
                let featuresObject = JSON.parse(filteredResponseData.replace(/'/g, '"'))

                console.log("Print return obj ", featuresObject['features']);
                returnFeature[0] = featuresObject['features'];
              },
              error: (response, status, error) => {
                console.error(error);
              }
        });

        console.log("Return feature", returnFeature);
        return returnFeature[0];
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
              console.log("Goeoms objs new: " + JSON.stringify(geometries));
              Object.values(geometries).forEach((geometry, idx) => {
                console.log("Geo obj in map loop: " + JSON.stringify(geometries));
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
  