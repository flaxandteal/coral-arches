define([
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/widget',
  'templates/views/components/widgets/auto-generate-id-widget.htm'
], function (ko, arches, uuid, _, WidgetViewModel, autoGenerateIdTemplate) {
  /**
   * registers a text-widget component for use in forms
   * @function external:"ko.components".text-widget
   * @param {object} params
   * @param {string} params.value - the value being managed
   * @param {function} params.config - observable containing config object
   * @param {string} params.config().label - label to use alongside the text input
   * @param {string} params.config().placeholder - default text to show in the text input
   */
  return ko.components.register('auto-generate-id-widget', {
    viewModel: function (params) {
      params.configKeys = ['id_placeholder', 'label', 'disabled'];
      WidgetViewModel.apply(this, [params]);

      const self = this;

      self.currentLanguage = ko.observable({ code: arches.activeLanguage });

      if (ko.isObservable(self.value)) {
        self.idValue = ko.isObservable(self.value()[arches.activeLanguage]?.value) 
          ? ko.unwrap(self.value()[arches.activeLanguage]?.value) 
          : self.value()[arches.activeLanguage]?.value;
      } else {
        self.idValue = ko.isObservable(self.value[arches.activeLanguage]?.value) 
          ? ko.unwrap(self.value[arches.activeLanguage]?.value) 
          : self.value[arches.activeLanguage]?.value;
      }

      if (!self.idValue) {
        self.idValue = uuid.generate();
        self.value({
          [arches.activeLanguage]: {
            value: self.idValue,
            direction: 'ltr'
          }
        });
      }
    },
    template: autoGenerateIdTemplate
  });
});
