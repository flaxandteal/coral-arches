define([
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/widget',
  'templates/views/components/widgets/cover-letter-widget.htm'
], function (ko, arches, uuid, _, WidgetViewModel, coverLetterWidgetTemplate) {
  /**
   * registers a text-widget component for use in forms
   * @function external:"ko.components".text-widget
   * @param {object} params
   * @param {string} params.value - the value being managed
   * @param {function} params.config - observable containing config object
   * @param {string} params.config().label - label to use alongside the text input
   * @param {string} params.config().placeholder - default text to show in the text input
   */
  return ko.components.register('cover-letter-widget', {
    viewModel: function (params) {
      params.configKeys = ['placeholder', 'label', 'disabled', 'defaultValue'];
      WidgetViewModel.apply(this, [params]);

      const self = this;

      self.coverLetterHtml = ko.observable();

      try {
        console.log('logging params: ', params);
        console.log('cover letter config: ', params.config());
      } catch (e) {
        console.error('failed loging config: ', e)
      }

      self.getValue = (value) => {
        if (ko.isObservable(value)) {
          if (value()?.[arches.activeLanguage]?.value) {
            console.log('get value here text')
            return value()[arches.activeLanguage].value
          } else {
            console.log('get value here')
            return value();
          }
        } else {
          if (value?.[arches.activeLanguage]?.value) {
            console.log('get value here text')
            return value[arches.activeLanguage].value
          } else {
            console.log('get value here default')
            return value;
          }
        }
      };
      
      if (self.getValue(self.value)) {
        console.log('got self.value: ', self.getValue(self.value))
        self.coverLetterHtml(self.getValue(self.value))
        console.log('covrr letter after self.lvaue ', self.coverLetterHtml());
      } else {
        console.log('got self.value: ', self.getValue(self.value))
      }

      if (self.getValue(params.coverLetterHtml)) {
        console.log('self.getValue(params.coverLetterHtml): ', self.getValue(params.coverLetterHtml))
        if (ko.isObservable(params.coverLetterHtml)) {
          self.coverLetterHtml = params.coverLetterHtml;
          console.log('covrr letter after params.coverLetterHtml ', self.coverLetterHtml());
        }
      } else {
        console.log('self.getValue(params.coverLetterHtml): ', self.getValue(params.coverLetterHtml))
      }

      self.coverLetterHtml.subscribe((value) => {
        console.log('self.coverLetterHtml updated: ', value);
        self.value({
          [arches.activeLanguage]: {
            value,
            direction: 'ltr'
          }
        });
      }, self);

      


      // console.log('cover-letter-widget: ', self);

      // // self.currentLanguage = ko.observable({ code: arches.activeLanguage });

      // const createTextObject = (value) => ({
      //   [arches.activeLanguage]: {
      //     value: value?.toString() || '',
      //     direction: 'ltr'
      //   }
      // });

      // try {
      //   console.log('cover letter config: ', params.config());
      // } catch (e) {
      //   console.error('failed loging config: ', e)
      // }

      // const init = () => {
      //   if (params.coverLetterHtml && ko.isObservable(params.coverLetterHtml)) {
      //     self.coverLetterHtml = params.coverLetterHtml;
      //     return;
      //   }
      //   if (params.coverLetterHtml) {
      //     self.coverLetterHtml = ko.observable(params.coverLetterHtml);
      //     return;
      //   }

      //   // self.coverLetterHtml = ko.observable(
      //   //   params.config().defaultValue[arches.activeLanguage]?.value
      //   // );
      //   console.log('cover letter: ', self.coverLetterHtml());
      // };

      // init();

      // console.log('cover letter end: ', self.coverLetterHtml);

      // if (self.value()?.[arches.activeLanguage]?.value) {
      //   console.log('value had value ', self.value()?.[arches.activeLanguage]?.value);
      //   self.coverLetterHtml = self.value()[arches.activeLanguage]?.value;
      // }

      // self.value({
      //   [arches.activeLanguage]: {
      //     value: ko.isObservable(params.coverLetterHtml)
      //       ? ko.unwrap(params.coverLetterHtml)
      //       : params.coverLetterHtml,
      //     direction: 'ltr'
      //   }
      // });

      // if (!ko.isObservable(self.coverLetterHtml)) {
      //   self.coverLetterHtml = self.value[arches.activeLanguage]?.value;
      // } else {
      //   self.coverLetterHtml = self.value()[arches.activeLanguage]?.value;
      // }

      // if (
      //   (ko.isObservable(self.coverLetterHtml) && !self.coverLetterHtml()) ||
      //   !self.coverLetterHtml
      // ) {
      //   // self.coverLetterHtml = ko.observable(uuid.generate());
      //   self.value({
      //     [arches.activeLanguage]: {
      //       value: self.coverLetterHtml,
      //       direction: 'ltr'
      //     }
      //   });
      // }
    },
    template: coverLetterWidgetTemplate
  });
});
