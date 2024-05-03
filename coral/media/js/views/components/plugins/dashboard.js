define([
    'jquery',
    'knockout',
    'underscore',
    'knockout-mapping',
    'arches',
    'templates/views/components/plugins/dashboard.htm',
    'views/components/search/paging-filter'
  ], function ($, ko, _, koMapping, arches, pageTemplate) {

    const pageViewModel = function (params) {
    }

  
    return ko.components.register('dashboard', {
      viewModel: pageViewModel,
      template: pageTemplate
    });
  });
  