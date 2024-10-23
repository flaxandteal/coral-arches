define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/alert',
  'templates/views/components/widgets/user-to-model-select.htm'
], function ($, ko, arches, uuid, _, AlertViewModel, template) {
  const viewModel = function (params) {
    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    params.multiple = true;
    params.datatype = 'resource-instance';

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.signOffNodes = {
      "42ec3232-fb26-11ee-838d-0242ac190006": {
        "groupsRequired" : [

        ],
        "value": ko.observable(false)
      },
      "998d6728-fb26-11ee-838d-0242ac190006": {
        "groupsRequired" : [

        ],
        "value": ko.observable(false)
      }
    }

    this.params = params

    console.log('user-to-model-select: ', this);

    this.isUserAlreadyAdded = ko.computed(() => {
      return false;
    }, this);

    this.addUserToResourceSelect = async () => {
      console.log('adding user to resource select');

      const response = await $.ajax({
        type: 'GET',
        url: '/user-to-model',
        dataType: 'json',
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });

      this.makeObject({
        
      }, {
        graph_id: ""
      })

      console.log('response: ', response);
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
  return ko.components.register('user-to-model-select', {
    viewModel,
    template: template
  });
});
