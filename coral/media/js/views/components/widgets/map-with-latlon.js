import $ from 'jquery';
import _ from 'underscore';
import ko from 'knockout';
import MapViewModel from 'views/components/widgets/map';
import mapTemplate from 'templates/views/components/widgets/map-with-latlon.htm';
import mapboxGl from 'bindings/mapbox-gl';
import sortable from 'bindings/sortable';

ko.components.register('map-with-latlon-widget', {
    viewModel: MapViewModel,
    template: mapTemplate,
});

export default MapViewModel;
