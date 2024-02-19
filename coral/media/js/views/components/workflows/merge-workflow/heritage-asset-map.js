define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/alert',
  'viewmodels/card-component',
  // 'viewmodels/map',
  'templates/views/components/workflows/merge-workflow/heritage-asset-map.htm'
], function (_, ko, koMapping, uuid, arches, AlertViewModel, CardComponentViewModel, template) {
  function viewModel(params) {
    const MapViewModel = require('viewmodels/map');

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

    self.setupMap = function (map) {
      map.on('load', function () {
        require(['mapbox-gl', 'mapbox-gl-geocoder'], function (MapboxGl, MapboxGeocoder) {
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

          map.addSource('feature-1', {
            type: 'geojson',
            data: self.geoFeature1
          });
          map.addSource('point-1', {
            type: 'geojson',
            data: self.geoPoint1
          });
          map.addLayer({
            id: 'feature-1',
            type: 'fill',
            source: 'feature-1', // reference the data source
            layout: {},
            paint: {
              'fill-color': '#0080ff', // blue color fill
              'fill-opacity': 0.5
            }
          });
          // Add a black outline around the polygon.
          map.addLayer({
            id: 'outline',
            type: 'line',
            source: 'feature-1',
            layout: {},
            paint: {
              'line-color': '#000',
              'line-width': 3
            }
          });

          self.map(map);
        });
      });
    };

    MapViewModel.apply(self, [params]);
    console.log('heritage-asset-map: ', self);

    require(['mapbox-gl', 'mapbox-gl-geocoder'], function (MapboxGl, MapboxGeocoder) {
      const marker = new MapboxGl.Marker()
        .setLngLat([-5.950716210511246, 54.60412993598476]) // Replace with your desired marker coordinates
        .addTo(self.map());
    });

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
