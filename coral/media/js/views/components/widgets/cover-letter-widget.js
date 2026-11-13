import ko from 'knockout';
import arches from 'arches';
import uuid from 'uuid';
import _ from 'underscore';
import WidgetViewModel from 'viewmodels/widget';
import coverLetterWidgetTemplate from 'templates/views/components/widgets/cover-letter-widget.htm';

export default ko.components.register('cover-letter-widget', {
    viewModel: function (params) {
      params.configKeys = ['placeholder', 'label', 'disabled', 'defaultValue', 'mode'];
      WidgetViewModel.apply(this, [params]);

      const self = this;

      self.mode = ko.observable(params.config.mode);

      self.coverLetterHtml = ko.observable();

      self.getValue = (value) => {
        if (ko.isObservable(value)) {
          if (value()?.[arches.activeLanguage]?.value) {
            return value()[arches.activeLanguage].value;
          } else {
            return value();
          }
        } else {
          if (value?.[arches.activeLanguage]?.value) {
            return value[arches.activeLanguage].value;
          } else {
            return value;
          }
        }
      };

      if (self.getValue(self.value)) {
        self.coverLetterHtml(self.getValue(self.value));
      }

      if (self.getValue(params.coverLetterHtml)) {
        if (ko.isObservable(params.coverLetterHtml)) {
          self.coverLetterHtml = params.coverLetterHtml;
        }
      }

      self.coverLetterHtml.subscribe((value) => {
        self.value({
          [arches.activeLanguage]: {
            value,
            direction: 'ltr'
          }
        });
      }, self);
    },
    template: coverLetterWidgetTemplate
  });
