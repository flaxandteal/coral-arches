define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
    'viewmodels/card-component',
  'templates/views/components/widgets/user-to-model-select.htm'
], function ($, ko, arches, uuid, _, CardViewModel, template) {
  const viewModel = function (params) {
    CardViewModel.apply(this, [params]);

    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    params.multiple = true;
    params.datatype = 'resource-instance';

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.signOffNodes = ko.observable({
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
    })

    this.params = params
    console.log("yolo")
    console.dir(this)

    this.setValue = () => {
      console.log("triggered")
      this.tile.data[this.nodeid]([{resourceId: '555ff689-1957-4ae7-a772-fc49bc49b76f'}])
    }

    this.isUserAlreadyAdded = ko.computed(() => {
      const userAddedDict = {}
      Object.keys(this.signOffNodes())
      .forEach(signatureNode => {
        userAddedDict[signatureNode] = this.tile.data[signatureNode]() ? true : false
      })
      return userAddedDict;
    }, this);

    this.confirmSignature = (nodeid, person) => {
      console.log(nodeid, person)
    }

    this.addUserToResourceSelect = async (nodeid) => {
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

      this.confirmSignature(nodeid, response.person)
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
