define([
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/widget',
  'templates/views/components/widgets/check-open-applications.htm'
], function (ko, arches, uuid, _, WidgetViewModel, checkOpenApplicationsTemplate) {
  /**
   * registers a text-widget component for use in forms
   * @function external:"ko.components".check-open-applications
   * @param {object} params
   * @param {string} params.value - the value being managed
   * @param {function} params.config - observable containing config object
   * @param {string} params.config().label - label to use alongside the text input
   * @param {string} params.config().placeholder - default text to show in the text input
   */
  return ko.components.register('check-open-applications', {
    viewModel: function (params) {
      params.configKeys = [];
      WidgetViewModel.apply(this, [params]);
    },
    template: checkOpenApplicationsTemplate
  });
});
