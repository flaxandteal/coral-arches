define([
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'views/components/widgets/text',
  'templates/views/components/widgets/auto-generate-id-widget.htm'
], function (ko, arches, uuid, _, TextViewModel, autoGenerateIdTemplate) {
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
      TextViewModel.apply(this, [params]);

      this.prefixStatic = ko.isObservable(params.config)
        ? params.config()?.prefix
        : params.config?.prefix;
      if (this.form?.componentData?.parameters?.prefix) {
        this.prefixStatic = this.form?.componentData?.parameters?.prefix;
      }

      this.setValue = (value) => {
        const localisedValue = {
          en: {
            direction: 'ltr',
            value: value
          }
        };
        if (ko.isObservable(this.value)) {
          this.value(localisedValue);
        } else {
          this.value = ko.observable();
          this.value(localisedValue);
        }
      };

      this.getValue = () => {
        return ko.unwrap(ko.unwrap(this.value)?.['en']?.['value']) || '';
      };

      this.newId = (prefix = null, length = 6) => {
        const year = new Date().getFullYear();
        const base62chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let id = '';
        for (let i = 0; i < length; i++) {
          id += base62chars[Math.floor(Math.random() * 62)];
        }
        return `${prefix || this.prefixStatic}/${year}/${id}`;
      };

      this.prefix.subscribe((value) => {
        this.currentText(this.newId(value))
        this.value({
          [arches.activeLanguage]: {
            value: this.currentText(),
            direction: 'ltr'
          }
        });
      }, this);

      this.createId = async () => {
        let id = this.newId();

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
                id = this.newId();
              }
            }
          });
        }
        return id;
      };

      this.init = async () => {
        if (!this.currentText()) {
          this.currentText(await this.createId());
        }
        if (!this.placeholder() !== this.id_placeholder()) {
          this.placeholder(this.id_placeholder());
        }
      };

      this.init()
    },
    template: autoGenerateIdTemplate
  });
});
