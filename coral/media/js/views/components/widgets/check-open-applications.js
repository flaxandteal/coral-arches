define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/alert',
  'templates/views/components/widgets/check-open-applications.htm'
  // 'templates/views/components/widgets/resource-instance-select.htm'
], function ($, ko, arches, uuid, _, AlertViewModel, checkOpenApplicationsTemplate) {
  const viewModel = function (params) {
    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    params.multiple = false;
    params.datatype = 'resource-instance';

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.totalOpenApplications = ko.observable();
    this.totalLicenses = ko.observable();
    this.currentState = ko.observable();

    this.limit = ko.observable(params.config().limit);

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

    this.totalLicensesMessage = ko.computed(() => {
      return `This licensee has had ${this.totalLicenses()} licenses approved.`
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
        await this.checkTotalApplications(value[0].resourceId())
        await this.checkOpenApplications(value[0].resourceId());
      } else {
        this.currentState(null);
      }
    }, this);

    this.openApplicationsRequest = null;
    this.totalLicensesRequest = null;
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
              '6d2924b6-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '6d294784-5891-11ee-a624-0242ac120004': {
                op: '',
                val: personResourceId
              },
              '6d293532-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '07d3905c-d58b-11ee-a02f-0242ac180006': { op: '', val: '' },
              '318184a4-d58b-11ee-89d9-0242ac180006': { op: 'eq', val: '' },
              '4936d1c6-d58b-11ee-a02f-0242ac180006': { op: 'eq', val: '' }
            },
            {
              op: 'and',
              '2a5151f0-c42e-11ee-94bf-0242ac180006': { op: 'null', val: null },
              'd48f412c-c42e-11ee-94bf-0242ac180006': { op: 'eq', val: '' },
              'c9f51490-c42d-11ee-94bf-0242ac180006': { op: '', val: '' },
              'c9f5174c-c42d-11ee-94bf-0242ac180006': { op: 'eq', val: '' },
              'c9f518aa-c42d-11ee-94bf-0242ac180006': { op: 'eq', val: '' }
            },
            {
              op: 'and',
              'aec103a2-48cf-11ee-8e4e-0242ac140007': { op: '~', lang: 'en', val: '' },
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '!eq',
                val: '8c454982-c470-437d-a9c6-87460b07b3d9'
              },
              'c2f40174-5dd5-11ee-ae2c-0242ac120008': { val: '' }
            },
            {
              op: 'and',
              'aec103a2-48cf-11ee-8e4e-0242ac140007': { op: '~', lang: 'en', val: '' },
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: '!eq',
                val: '40557c74-cb18-4111-a349-a91eb926e163'
              },
              'c2f40174-5dd5-11ee-ae2c-0242ac120008': { val: '' }
            }
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
        },
        complete: function (request, status) {
          this.openApplicationsRequest = undefined;
        }
      });
    };

    this.checkTotalApplications = async (personResourceId) => {
      if (this.totalLicensesRequest) {
        this.totalLicensesRequest.abort();
      }

      this.totalLicensesRequest = $.ajax({
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
              '6d2924b6-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '6d294784-5891-11ee-a624-0242ac120004': {
                op: '',
                val: personResourceId
              },
              '6d293532-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '07d3905c-d58b-11ee-a02f-0242ac180006': { op: '', val: '' },
              '318184a4-d58b-11ee-89d9-0242ac180006': { op: 'eq', val: '' },
              '4936d1c6-d58b-11ee-a02f-0242ac180006': { op: 'eq', val: '' }
            },
            {
              op: 'and',
              '2a5151f0-c42e-11ee-94bf-0242ac180006': {
                op: 'eq',
                val: '0c888ace-b068-470a-91cb-9e5f57c660b4'
              },
              'd48f412c-c42e-11ee-94bf-0242ac180006': { op: 'eq', val: '' },
              'c9f51490-c42d-11ee-94bf-0242ac180006': { op: '', val: '' },
              'c9f5174c-c42d-11ee-94bf-0242ac180006': { op: 'eq', val: '' },
              'c9f518aa-c42d-11ee-94bf-0242ac180006': { op: 'eq', val: '' }
            },
            {
              op: 'and',
              'aec103a2-48cf-11ee-8e4e-0242ac140007': { op: '~', lang: 'en', val: '' },
              'a79fedae-bad5-11ee-900d-0242ac180006': {
                op: 'eq',
                val: '8c454982-c470-437d-a9c6-87460b07b3d9'
              },
              'c2f40174-5dd5-11ee-ae2c-0242ac120008': { val: '' }
            }
          ])
        },
        context: this,
        success: function (response) {
          console.log('response: ', response)
          this.totalLicenses(response.results.hits.total.value);
        },
        error: function (response, status, error) {
          if (this.totalLicensesRequest.statusText !== 'abort') {
            console.log(response, status, error);
            params.pageVm.alert(
              new AlertViewModel(
                'ep-alert-red',
                arches.translations.requestFailed.title,
                response.responseText
              )
            );
          }
        },
        complete: function (request, status) {
          this.totalLicensesRequest = undefined;
        }
      });
    };

    this.init = async () => {
      if (this.value) {
        await this.checkTotalApplications(this.value());
        await this.checkOpenApplications(this.value());
      }
    }

    this.init()
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
