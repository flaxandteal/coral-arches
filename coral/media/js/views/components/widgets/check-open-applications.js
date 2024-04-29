define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/alert',
  'templates/views/components/widgets/check-open-applications.htm',
  // 'templates/views/components/widgets/resource-instance-select.htm'
], function (
  $,
  ko,
  arches,
  uuid,
  _,
  AlertViewModel,
  checkOpenApplicationsTemplate
) {

  const viewModel = function (params) {
    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    params.multiple = false;
    params.datatype = 'resource-instance';

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.totalOpenApplications = ko.observable();
    this.currentState = ko.observable();

    this.limit = ko.observable(params.config().limit)

    this.limit.subscribe((value) => {
      this.config({
        ...this.config(),
        limit: value
      });
    }, this);

    this.OK = 'OK';
    this.WARNING = 'WARNING';
    this.MAX = 'MAX';
    this.EXCEEDED = 'EXCEEDED';

    this.states = {
      [this.OK]: {
        colour: '#5cb85c',
        title: 'Ok',
        message: 'This person has [openApplications] open applications. It is ok to proceed.'
      },
      [this.WARNING]: {
        colour: '#fcb103',
        title: 'Warning',
        message:
          'This person has [openApplications] open applications. They are almost at their limit, consider reviewing their open applications before continuing.'
      },
      [this.MAX]: {
        colour: '#f75d3f',
        title: 'Maximum Limit',
        message:
          'This person has [openApplications] open applications. Continuing with this application will exceed their limit. Please consider reviewing their other applications.'
      },
      [this.EXCEEDED]: {
        colour: '#f75d3f',
        title: 'Exceeded',
        message:
          'This person has [openApplications] open applications. They are currently over the limit of open applications. It is not recommended to continue without finishing their other applications first.'
      }
    };

    this.message = ko.computed(() => {
      if (this.currentState() in this.states) {
        return this.states[this.currentState()].message.replace(
          '[openApplications]',
          this.totalOpenApplications()
        );
      } else {
        return '';
      }
    }, true);

    this.colour = ko.computed(() => {
      if (this.currentState() in this.states) {
        return this.states[this.currentState()].colour;
      } else {
        return '';
      }
    }, true);

    this.title = ko.computed(() => {
      if (this.currentState() in this.states) {
        return this.states[this.currentState()].title;
      } else {
        return '';
      }
    }, true);

    this.value.subscribe(async (value) => {
      console.log('value selection updated: ', value);
      if (value && value[0]?.resourceId()) {
        await this.checkOpenApplications(value[0].resourceId());
      } else {
        this.currentState(null);
      }
    }, this);

    this.openApplicationsRequest = null;
    this.openApplicationsState = ko.observable(false);

    this.checkOpenApplications = async (personResourceId) => {
      this.currentState(null);

      if (this.openApplicationsRequest) {
        this.openApplicationsRequest.abort();
      }

      this.openApplicationsRequest = $.ajax({
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
              '6d2924b6-5891-11ee-a624-0242ac120004': {
                // Applicant
                op: '',
                val: personResourceId // Resource ID
              },
              // '6d292a2e-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              // '6d292f88-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '6d293532-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '6d294784-5891-11ee-a624-0242ac120004': { op: '', val: '' }
            },
            {
              op: 'or',
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '',
                val: '3e437a57-954f-49de-baae-536c7e0bcb74' // Not Used
              }
            },
            {
              op: 'or',
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '',
                val: '5b119129-7d05-44af-b7f3-d6cc4e7d13de' // Withdrawn
              }
            },
            // {
            //   op: 'or',
            //   'a79fedae-bad5-11ee-900d-0242ac180006': {
            //     op: '',
            //     val: '40557c74-cb18-4111-a349-a91eb926e163' // Refused
            //   }
            // },
            // {
            //   op: 'or',
            //   'a79fedae-bad5-11ee-900d-0242ac180006': {
            //     op: '',
            //     val: '8c454982-c470-437d-a9c6-87460b07b3d9' // Granted
            //   }
            // },
            {
              op: 'or',
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '',
                val: '48e031eb-9be3-4ba2-9cb7-798184a9d2bf' // Paused
              }
            },
            {
              op: 'or',
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '',
                val: 'af08ac99-205f-4d97-8829-55a8e7da1c9d' // In progress
              }
            },
            {
              op: 'or',
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '',
                val: '0df1843b-28e9-4868-9a9a-d19229fe5c48' // Acknowledged
              }
            },
            {
              op: 'or',
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '',
                val: '2e2703e4-4f19-47ca-842d-a45c8502a547' // Received
              }
            },
          ])
        },
        context: this,
        success: function (response) {
          this.totalOpenApplications(response.results.hits.total.value);
          let limit = parseInt(this.limit());

          switch (true) {
            case this.totalOpenApplications() <= limit - 2:
              this.currentState(this.OK);
              break;
            case this.totalOpenApplications() === limit - 1:
              this.currentState(this.WARNING);
              break;
            case this.totalOpenApplications() === limit:
              this.currentState(this.MAX);
              break;
            case this.totalOpenApplications() >= limit + 1:
              this.currentState(this.EXCEEDED);
              break;
          }

          // console.log('this.currentState(): ', this.currentState());
          // console.log('this.totalOpenApplications(): ', this.totalOpenApplications());
        },
        error: function (response, status, error) {
          if (this.openApplicationsRequest.statusText !== 'abort') {
            console.log(response, status, error);
            params.pageVm.alert(
              new AlertViewModel(
                'ep-alert-red',
                arches.translations.requestFailed.title,
                response.responseText
              )
            );
          }
          this.exceededThreshold = false;
        },
        complete: function (request, status) {
          this.openApplicationsRequest = undefined;
        }
      });
    };
  };

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
    viewModel,
    template: checkOpenApplicationsTemplate
  });
});
