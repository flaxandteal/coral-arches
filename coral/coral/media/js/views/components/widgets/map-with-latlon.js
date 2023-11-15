define([
  'jquery',
  'underscore',
  'knockout',
  'views/components/widgets/map',
  'templates/views/components/widgets/map-with-latlon.htm',
  'bindings/mapbox-gl',
  'bindings/sortable'
], function ($, _, ko, MapViewModel, mapTemplate) {
  ko.components.register('map-with-latlon-widget', {
    viewModel: MapViewModel,
    template: mapTemplate
  });
  return MapViewModel;
});
