define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/alert',
  'templates/views/components/widgets/check-open-applications.htm'
], function ($, ko, arches, uuid, _, AlertViewModel, checkOpenApplicationsTemplate) {
  const viewModel = function (params) {
    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    params.multiple = true;
    params.datatype = 'resource-instance';

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.applicationData = ko.observable({});
    this.totalOpenApplications = ko.observable();
    this.totalLicences = ko.observable();
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
        message:
          'This person has [openApplications] open applications[includesThisOne]. It is ok to proceed.'
      },
      [this.WARNING]: {
        colour: '#fcb103',
        title: 'Warning',
        message:
          'This person has [openApplications] open applications[includesThisOne]. They are almost at their limit, consider reviewing their open applications before continuing.'
      },
      [this.MAX]: {
        colour: '#f75d3f',
        title: 'Maximum Limit',
        message:
          'This person has [openApplications] open applications[includesThisOne]. Continuing with this application will exceed their limit. Please consider reviewing their other applications.'
      },
      [this.EXCEEDED]: {
        colour: '#f75d3f',
        title: 'Exceeded',
        message:
          'This person has [openApplications] open applications[includesThisOne]. They are currently over the limit of open applications. It is not recommended to continue without finishing their other applications first.'
      }
    };

    this.message = (resourceId, state) =>
      ko.computed(() => {
        if (!this.applicationData()?.[resourceId]) return '';
        if (state in this.states) {
          let message = this.states[state].message.replace(
            '[openApplications]',
            this.applicationData()?.[resourceId].totalOpenApplications
          );

          if (this.applicationData()?.[resourceId].includingThisOne) {
            message = message.replace('[includesThisOne]', ', including this one');
          } else {
            message = message.replace('[includesThisOne]', '');
          }

          return message;
        } else {
          return '';
        }
      }, true);

    this.totalLicencesMessage = (resourceId) =>
      ko.computed(() => {
        if (!this.applicationData()?.[resourceId]) return '';
        let message = `This licensee has had a total of ${
          this.applicationData()[resourceId].totalLicences
        } licences[includesThisOne].`;

        if (this.applicationData()?.[resourceId].includingThisOne) {
          message = message.replace('[includesThisOne]', ', including this one');
        } else {
          message = message.replace('[includesThisOne]', '');
        }

        return message;
      }, true);

    this.colour = (state) =>
      ko.computed(() => {
        if (state in this.states) {
          return this.states[state].colour;
        } else {
          return '';
        }
      }, true);

    this.title = (state) =>
      ko.computed(() => {
        if (state in this.states) {
          return this.states[state].title;
        } else {
          return '';
        }
      }, true);

    this.value.subscribe(async (value) => {
      await this.loadApplicationData(value);
    }, this);

    this.loadApplicationData = async (selectedResources) => {
      const applicationData = {};

      selectedResources.forEach((resource) => {
        applicationData[ko.unwrap(resource.resourceId)] = {
          resourceId: ko.unwrap(resource.resourceId),
          state: null,
          totalOpenApplications: null,
          totalLicences: null,
          name: null
        };
      });

      // This is not my best work lol
      for (const data of Object.values(applicationData)) {
        await Promise.all([
          new Promise(async (resolve) => {
            const result = await this.checkTotalApplications(data.resourceId);
            applicationData[data.resourceId].totalLicences = result;
            resolve();
          }),
          new Promise(async (resolve) => {
            const result = await this.checkOpenApplications(data.resourceId);
            applicationData[data.resourceId].totalOpenApplications = result.total;
            applicationData[data.resourceId].state = result.state;
            applicationData[data.resourceId].includingThisOne = result.includingThisOne;
            resolve();
          }),
          new Promise(async (resolve) => {
            const result = await this.getName(data.resourceId);
            applicationData[data.resourceId].name = result;
            resolve();
          })
        ]);
        this.applicationData(null);
        this.applicationData(applicationData);
      }
    };

    this.openApplicationsRequest = null;
    this.totalLicencesRequest = null;
    this.getNameRequest = null;

    this.checkOpenApplications = async (personResourceId) => {
      const result = {
        total: null,
        state: null
      };

      this.openApplicationsRequest = await $.ajax({
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
                val: [personResourceId]
              },
              '6d293532-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '07d3905c-d58b-11ee-a02f-0242ac180006': { op: '', val: '' },
              '318184a4-d58b-11ee-89d9-0242ac180006': { op: 'eq', val: '' },
              '4936d1c6-d58b-11ee-a02f-0242ac180006': { op: 'eq', val: '' }
            },
            {
              op: 'and',
              '27740e7c-7118-11ef-af33-0242ac120006': { op: 'eq', val: '' },
              'ff3de496-7117-11ef-83a1-0242ac120006': {
                op: 'eq',
                val: 'd33327e8-2b9d-4bab-a07e-f0ded18ded3e'
              },
              'aec103a2-48cf-11ee-8e4e-0242ac140007': { op: '~', lang: 'en', val: '' },
              'a79fedae-bad5-11ee-900d-0242ac180006': { op: 'eq', val: '' },
              'ba8aab44-2d4d-11ef-bbfd-0242ac120006': { op: 'eq', val: '' },
              'fd9b98a8-2d4d-11ef-bbfd-0242ac120006': { op: 'eq', val: '' },
              'c2f40174-5dd5-11ee-ae2c-0242ac120008': { val: '' },
              '8f87fdae-2d50-11ef-bbfd-0242ac120006': { op: 'eq', val: '' },
              'a08ed94c-2d50-11ef-bbfd-0242ac120006': { op: 'eq', val: '' }
            }
          ])
        },
        context: this,
        success: function (response) {
          result.total = response.results.hits.total.value;
          response.results.hits.hits.forEach((resource) => {
            if (resource._id === ko.unwrap(this.tile.resourceinstance_id)) {
              result.includingThisOne = true;
            }
          });
          let limit = parseInt(this.limit());

          switch (true) {
            case result.total <= limit - 2:
              result.state = this.OK;
              break;
            case result.total === limit - 1:
              result.state = this.WARNING;
              break;
            case result.total === limit:
              result.state = this.MAX;
              break;
            case result.total >= limit + 1:
              result.state = this.EXCEEDED;
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

      return result;
    };

    this.checkTotalApplications = async (personResourceId) => {
      let result = null;

      this.totalLicencesRequest = await $.ajax({
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
                val: [personResourceId]
              },
              '6d293532-5891-11ee-a624-0242ac120004': { op: '', val: '' },
              '07d3905c-d58b-11ee-a02f-0242ac180006': { op: '', val: '' },
              '318184a4-d58b-11ee-89d9-0242ac180006': { op: 'eq', val: '' },
              '4936d1c6-d58b-11ee-a02f-0242ac180006': { op: 'eq', val: '' }
            }
          ])
        },
        context: this,
        success: function (response) {
          result = response.results.hits.total.value;
        },
        error: function (response, status, error) {
          console.log('checkTotalApplications PROMISES error');

          if (this.totalLicencesRequest.statusText !== 'abort') {
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
          console.log('checkTotalApplications PROMISES complete');
          this.totalLicencesRequest = undefined;
        }
      });

      return result;
    };

    this.getName = async (personResourceId) => {
      let result = null;

      this.getNameRequest = await $.ajax({
        type: 'GET',
        url: arches.urls.search_results,
        data: {
          id: personResourceId,
          tiles: true
        },
        context: this,
        success: function (response) {
          result = response.results.hits.hits?.[0]?.['_source']['displayname'];
        },
        error: function (response, status, error) {
          if (this.totalLicencesRequest.statusText !== 'abort') {
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
          this.getNameRequest = undefined;
        }
      });

      return result;
    };

    this.init = async () => {
      if (this.value()) {
        await this.loadApplicationData(this.value());
      }
    };

    this.init();
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
