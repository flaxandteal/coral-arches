define([
  'jquery',
  'underscore',
  'knockout',
  'proj4',
  'views/components/widgets/map',
  'templates/views/components/widgets/map-with-latlon.htm',
  'bindings/mapbox-gl',
  'bindings/sortable'
], function ($, _, ko, proj4, MapViewModel, mapTemplate) {
  ko.components.register('map-with-latlon-widget', {
    viewModel: function (config) {
      MapViewModel.apply(this, [config]);
      proj4.defs('WGS84', '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');
      proj4.defs(
        'EPSG:29902',
        '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +a=6377340.189 +rf=299.3249646 +towgs84=482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15 +units=m +no_defs +type=crs'
      );
      this.source = new proj4.Proj('WGS84');
      this.dest = new proj4.Proj('EPSG:29902');

      this.project = function (lat, long) {
        let testpt = new proj4.Point(lat, long);
        return proj4.transform(this.source, this.dest, testpt);
      };
    },
    template: mapTemplate
  });
  return MapViewModel;
});
