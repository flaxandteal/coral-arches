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
      params.configKeys = ['id_placeholder', 'label', 'disabled', 'prefix'];
      WidgetViewModel.apply(this, [params]);

      const self = this;

      self.currentLanguage = ko.observable({ code: arches.activeLanguage });

      self.idValue = ko.observable();
      self.newId = (length = 6) => {
        const year = new Date().getFullYear();
        const id = Math.random().toString(20).substr(2, length).toUpperCase();
        return `${params.config().prefix}/${year}/${id}`;
      };

      self.prefix.subscribe((value) => {
        console.log('idValue changed: ', value);
        self.value({
          [arches.activeLanguage]: {
            value: self.idValue(),
            direction: 'ltr'
          }
        });
      }, self);

      this.createId = async () => {
        let id = self.newId();

        let unique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!unique && attempts <= maxAttempts) {
          attempts++;
          await $.ajax({
            type: 'GET',
            url: arches.urls.search_results,
            data: {
              'paging-filter': 1,
              tiles: true,
              format: 'tilecsv',
              reportlink: 'false',
              precision: '6',
              total: '0',
              'advanced-search': JSON.stringify([
                {
                  op: 'and',
                  '991c5326-48b6-11ee-85af-0242ac140007': { op: 'not_null', lang: 'en', val: '' },
                  '991c4340-48b6-11ee-85af-0242ac140007': { op: 'not_null', val: '' },
                  '991c49b2-48b6-11ee-85af-0242ac140007': {
                    op: '~',
                    lang: 'en',
                    val: id
                  }
                }
              ])
            },
            context: this,
            success: function (response) {
              unique = response.results.hits.total.value === 0;
            },
            error: function (response, status, error) {
              console.error(response, status, error);
            },
            complete: function (request, status) {
              if (!unique) {
                id = self.newId();
              }
            }
          });
        }
        return id;
      };

      (async () => {
        if (ko.isObservable(self.value)) {
          self.idValue(
            ko.isObservable(self.value()[arches.activeLanguage]?.value)
              ? ko.unwrap(self.value()[arches.activeLanguage]?.value)
              : self.value()[arches.activeLanguage]?.value
          );
        } else {
          self.idValue(
            ko.isObservable(self.value[arches.activeLanguage]?.value)
              ? ko.unwrap(self.value[arches.activeLanguage]?.value)
              : self.value[arches.activeLanguage]?.value
          );
        }

        if (!self.idValue()) {
          self.idValue(await this.createId());
          self.value({
            [arches.activeLanguage]: {
              value: self.idValue(),
              direction: 'ltr'
            }
          });
        }
      })();
    },
    template: autoGenerateIdTemplate
  });
});
