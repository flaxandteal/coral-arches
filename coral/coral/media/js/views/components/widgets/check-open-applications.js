define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/resource-instance-select',
  // 'templates/views/components/widgets/resource-instance-select.htm'
  'templates/views/components/widgets/check-open-applications.htm'
], function (
  $,
  ko,
  arches,
  uuid,
  _,
  ResourceInstanceSelectViewModel,
  checkOpenApplicationsTemplate
) {
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
      params.multiple = false;
      params.datatype = 'resource-instance';
      params.configKeys = ['placeholder', 'defaultResourceInstance'];

      ResourceInstanceSelectViewModel.apply(this, [params]);

      this.pageVm = params.pageVm;
      this.totalOpenApplications = ko.observable();
      this.currentState = ko.observable();

      this.limit = ko.observable(6);

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
        if (value) {
          await this.checkOpenApplications(value[0].resourceId());
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
                '6d292a2e-5891-11ee-a624-0242ac120004': { op: '', val: '' },
                '6d292f88-5891-11ee-a624-0242ac120004': { op: '', val: '' },
                '6d293532-5891-11ee-a624-0242ac120004': { op: '', val: '' },
                '6d294784-5891-11ee-a624-0242ac120004': { op: '', val: '' }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: 'dc157bc7-e470-41b6-88fa-f69fa75f4fc4' // Not issued
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: '241584bc-a03c-4d8b-926b-5d66754b2373' // Preliminary
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: '14650fec-d4ae-4e9d-9096-95d60f35caa8' // Received
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: '03dc689e-4911-4a04-95c0-4b4a4b83dc7a' // Deferred
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: '8c454982-c470-437d-a9c6-87460b07b3d9' // Final
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: 'a7f3b4ae-6b41-423c-bc10-059358f6f2ec' // Not Used
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: 'a54a29a0-b82e-4123-95d9-0e28f05323b3' // Refused
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: '49f0655b-55e5-450e-acfa-cb62f0af7d46' // Summary
                }
              },
              {
                op: 'or',
                'fb18edd0-48b8-11ee-84da-0242ac140007': {
                  op: '',
                  val: '4840c102-dcea-4a9a-b74c-d405301f8db5' // Not Received
                }
              }
            ])
          },
          context: this,
          success: function (response) {
            console.log('search response: ', response);
            this.totalOpenApplications(response.results.hits.total.value);

            switch (true) {
              case this.totalOpenApplications() <= this.limit() - 2:
                this.currentState(this.OK);
                break;
              case this.totalOpenApplications() === this.limit() - 1:
                this.currentState(this.WARNING);
                break;
              case this.totalOpenApplications() === this.limit():
                this.currentState(this.MAX);
                break;
              case this.totalOpenApplications() >= this.limit() + 1:
                this.currentState(this.EXCEEDED);
                break;
            }

            console.log('this.currentState(): ', this.currentState());
            console.log('this.totalOpenApplications(): ', this.totalOpenApplications());

            // if (totalOpenApplications >= 2) {
            //   this.exceededThreshold = true;
            //   // this.pageVm.alert(
            //   //   new AlertViewModel(
            //   //     'ep-alert-warning',
            //   //     'Warning',
            //   //     `This user currently has ${totalOpenApplications} applications open it is not recommended to continue until the others have completed their course.`
            //   //   )
            //   // );
            // }
            // _.each(
            //   this.viewModel.sharedStateObject.searchResults,
            //   function (value, key, results) {
            //     if (key !== 'timestamp') {
            //       delete this.viewModel.sharedStateObject.searchResults[key];
            //     }
            //   },
            //   this
            // );
            // _.each(
            //   response,
            //   function (value, key, response) {
            //     if (key !== 'timestamp') {
            //       this.viewModel.sharedStateObject.searchResults[key] = value;
            //     }
            //   },
            //   this
            // );
            // this.viewModel.sharedStateObject.searchResults.timestamp(response.timestamp);
            // this.viewModel.sharedStateObject.userIsReviewer(response.reviewer);
            // this.viewModel.sharedStateObject.userid(response.userid);
            // this.viewModel.total(response.total_results);
            // this.viewModel.alert(false);
          },
          error: function (response, status, error) {
            if (this.openApplicationsRequest.statusText !== 'abort') {
              this.pageVm.alert(
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
            // window.history.pushState({}, '', '?' + $.param(queryString).split('+').join('%20'));
          }
        });
      };
    },
    template: checkOpenApplicationsTemplate
  });
});
