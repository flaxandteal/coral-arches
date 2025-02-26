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
    'viewmodels/map',
    'mapbox-gl',
    'mapbox-gl-geocoder',
    'templates/views/components/workflows/assign-consultation-workflow/related-heritage-asset-map.htm'
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
    MapViewModel,
    MapboxGl,
    MapboxGeocoder,    
    template
  ) {
    function viewModel(params) {
      this.loading = params.pageVm.loading;
      const self = this;
      const dontUpdate = ko.observable({})
      const featureIndex = ko.observable(0)

      this.RELATED_HERITAGE_NODE_ID = 'bc64746e-cf4a-11ef-997c-0242ac120007';
      this.GEO_NODE_ID = '87d3872b-f44f-11eb-bd0c-a87eeabdefba';
      
      MapViewModel.apply(self, [params]);


        this.setupMap = function (map) {
          map.on('load', async function() {
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
              const geometries = await getGeometryTiles()
              updateMap(geometries)
          });
        };

      const getGeometryTiles = async () => {
        try {
            const response = await $.ajax({
                type: 'GET',
                url: arches.urls.root + `resource/${params.baseResourceId}/tiles?nodeid=${this.RELATED_HERITAGE_NODE_ID}`,
                context: this
            });    
            if (response) {
                const tiles = response.tiles[0].data[this.RELATED_HERITAGE_NODE_ID];
                let geometries = [];
    
                for (const tile of tiles) {
                    const data = await getGeoJsonData(tile.resourceId);
                    if (data && Array.isArray(data)) {
                        geometries = [...geometries, ...data];
                    }
                }
                return geometries;
            }
        } catch (error) {
            console.error("Error fetching tiles:", error);
            return [];
        }
      };
      
      const getGeoJsonData = async(resourceId) => {
        try {
          const response = await $.ajax({
            type: 'GET',
            url:
              arches.urls.root +
              `resource/${resourceId}/tiles?nodeid=${this.GEO_NODE_ID}`,
            context: this
          })
          if (response.tiles[0] !== undefined) {
            let featuresObject = response.tiles[0].data['87d3d7dc-f44f-11eb-bee9-a87eeabdefba']['features'];

          if (dontUpdate()[featuresObject[0].id]) {
            return
          } 
          if (self.map()) {
            dontUpdate({...dontUpdate(), [featuresObject[0].id] : true})
          }
            return featuresObject
          } else {
            return
          }
          
        } catch (error) {
          console.error("Error fetching GeoJSON data:", error);
          return null;
        }
      }

    const updateMap = (geometries) => {
      let map = self.map()
      let bounds = new MapboxGl.LngLatBounds();
      Object.values(geometries).forEach((geometry, idx) => {
        let colour = '#0000FF';
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
          map.addSource(geometry.id, {
            type: 'geojson',
            data: geometry
          });
          map.addLayer({
            id: 'myGeoJSON-polygon-layer' + geometry.id,
            type: 'fill',
            source: geometry.id,
            'source-layer': '',
            paint: {
              'fill-color': colour,
              'fill-opacity': 0.5
            },
            filter: ['==', '$type', 'Polygon']
          });
          map.addLayer({
            id: 'myGeoJSON-circle-layer' + geometry.id,
            type: 'circle',
            source: geometry.id,
            'source-layer': '',
            paint: {
              'circle-color': colour,
              'circle-radius': 6,
              'circle-opacity': 0.5
            },
            filter: ['==', '$type', 'Point']
          });
          map.addLayer({
            id: 'myGeoJSON-line-layer' + geometry.id,
            type: 'line',
            source: geometry.id,
            'source-layer': '',
            paint: {
              'line-color': colour,
              'line-width': 2,
              'line-opacity': 0.5
            },
            filter: ['==', '$type', 'LineString']
          });
          featureIndex(featureIndex() + 1)
          map.fitBounds(bounds, { padding: 20 });

          mapConfigurator.postConfig(map);
          self.map(map)
      });
    }
    }

    
  
    ko.components.register('related-heritage-asset-map', {
      viewModel: viewModel,
      template: template
    });
  
    return viewModel;
  });
  