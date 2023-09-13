define([
    'knockout',
    'arches',
    'uuid',
    'knockout-mapping',
    'underscore',
    'viewmodels/widget',
    'templates/views/components/widgets/cover-letter-widget.htm'
  ], function (ko, koMapping, arches, uuid, _, WidgetViewModel, coverLetterWidget) {
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
        params.configKeys = ['id_placeholder', 'label', 'disabled'];
        WidgetViewModel.apply(this, [params]);
        const self = this;
        self.showi18nOptions = ko.observable(false);
        const initialCurrent = {};
        initialCurrent[arches.activeLanguage] = {value: '', direction: 'ltr'};
        const currentLanguage = {"code": arches.activeLanguage};
        console.log("mamma said ", koMapping)
        let currentValue = ko.observable(initialCurrent);
        self.currentLanguage = ko.observable(currentLanguage);
        this.currentText = ko.observable('')
        this.placeholder = ko.observable('')

        
        this.activityResourceData = ko.observable()
        this.licenseResourceData = ko.observable()
        this.actorTileData = ko.observable()
        this.actorReportData = ko.observable([])
        this.reportVals = {}
        this.applicant = ko.observable('')
        this.company = ko.observable('')
        this.areaName = ko.observable('')
        this.bFileNumber = ko.observable('')
        this.licenseNo = ko.observable('')
        this.seniorInspector = ko.observable('')
        this.signed = ko.observable('')
        this.receivedDate = ko.observable('')
        this.acknowledgedDate = ko.observable('')
        this.decisionDate = ko.observable('')
        this.buildingName = ko.observable('')
        this.buildingNumber = ko.observable('')
        this.street = ko.observable('')
        this.buildingNumberSubSt = ko.observable('')
        this.subStreet = ko.observable('')
        this.city = ko.observable('')
        this.county = ko.observable('')
        this.postCode = ko.observable('')
        
        this.html = ko.computed({
            read: function () {
              `<div data-bind="style: 'text-align': 'right'>
              ${this.buildingName() != '' ? this.buildingName() + ', <br />' : ''} 
              ${this.buildingNumber()} ${this.street()}, 
              ${this.buildingNumberSubSt() != '' ? this.buildingNumberSubSt() + ' ' : ''}
              ${this.subStreet() != '' ? this.subStreet() + ',' : ''}
              <br />${this.city()},
              <br />${this.county()},
              <br />${this.postCode()}
              </div>
              <p class="summary-value" data-bind="text: 'Date: ' + ${sendDate()}"></p>
              <p class="summary-value" data-bind="text: 'Our Ref: ' + ${bFileNumber()}"></p>
              <p class="summary-value" data-bind="text: 'Dear ' + ${this.applicant()} + ', ' + ${this.company()}"></p>
              <p class="summary-value" data-bind="text: 'Site: ' + ${this.reportVals.areaName} + '.'"></p>
              <p class="summary-value" data-bind="text: 'License No: ' + ${this.reportVals.licenseNo}"></p>
              <p class="summary-value" data-bind="text: 'Further to your application on ' + ${this.appDate()} + ', please find attached an Excavation License for the above-mentioned location.'"></p>
              <p class="summary-value" data-bind="text: ${this.signed()}"></p>
              <p class="summary-value" data-bind="text: ${this.signed() != this.seniorInspector() ? this.seniorInspector() : ''}"></p>
              `
            },
            write: function (){
    
            }
            }, this)

        try {
           self.idValue = self.value()[arches.activeLanguage]?.value;
        } catch {
          self.idValue = self.value[arches.activeLanguage]?.value()
        }

        console.log("identify your widget!", self.idValue)
    
        if (ko.isObservable(self.idValue) && !self.idValue()) {
          self.value({
            [arches.activeLanguage]: {
              value: self.idValue,
              direction: 'ltr'
            }
          });
        }
      },
      template: coverLetterWidget
    });
  });
  