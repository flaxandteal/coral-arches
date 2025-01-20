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
    'mapbox-gl',
    'mapbox-gl-geocoder',
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
    MapboxGl,
    MapboxGeocoder,    
    template
  ) {
    function viewModel(params) {
      const MapViewModel = require('viewmodels/map');
      this.loading = params.pageVm.loading;
      const self = this;
      const geoTiles = ko.observable([])
      geoTiles.subscribe((geometries) => {
        updateMap(geometries, this.map)
      })
      this.RELATED_HERITAGE_NODE_ID = 'bc64746e-cf4a-11ef-997c-0242ac120007';
      this.GEO_NODE_ID = "87d3872b-f44f-11eb-bd0c-a87eeabdefba";

      MapViewModel.apply(self, [params]);



      this.setupMap = function (map) {
        map.on('load', function () {
          require(['mapbox-gl', 'mapbox-gl-geocoder'], function (MapboxGl, MapboxGeocoder) {
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

              self.zoom(parseFloat(map.getZoom()));
            });

            map.on('dragend', function () {
              var center = map.getCenter();

              self.centerX(parseFloat(center.lng));
              self.centerY(parseFloat(center.lat));
            });

            mapConfigurator.postConfig(map);
            self.map(map);
            
            this.map = map

          });
        });
      };




      getGeometryTiles = async () => {
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
        });
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

                returnFeature[0] = featuresObject['features'];
                geoTiles(returnFeature[0])
              },
              error: (response, status, error) => {
              }
        });

        return returnFeature[0];
      };
      getGeometryTiles()
    }

    const updateMap = (geometries, map) => {
      let bounds = new MapboxGl.LngLatBounds();
        Object.values(geometries).forEach((geometry, idx) => {
          let colour = '#0000FF';
          if (idx <= 0) colour = '#FF0000';
            if (geometry.geometry.type === 'Point') {
              bounds.extend(geometry.geometry.coordinates);
            } else if (
              geometry.geometry.type === 'Polygon' ||
              geometry.geometry.type === 'MultiPolygon'
            ) {
              geometry.geometry.coordinates.forEach(function (polygon) {
                polygon.forEach(function (coord) {
                  bounds.extend(coord);
                });
              });
            } else if (
              geometry.geometry.type === 'LineString' ||
              geometry.geometry.type === 'MultiLineString'
            ) {
              geometry.geometry.coordinates.forEach(function (coord) {
                bounds.extend(coord);
              });
            }
            map.addSource('myGeoJSON' + idx + j + 1, {
              type: 'geojson',
              data: geometry
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
    }
  
    ko.components.register('heritage-asset-map', {
      viewModel: viewModel,
      template: template
    });
  
    return viewModel;
  });
  