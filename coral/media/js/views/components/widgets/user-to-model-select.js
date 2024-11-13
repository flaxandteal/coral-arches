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
    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.params = params
    this.name = ko.observable('')
    this.personId = ko.observable('')
    this.permittedToSign = ko.observable(!!this.tile.data[this.node.id]())
    this.isUserAlreadyAdded = !!this.tile.data[this.node.id]()
    this.isUserAdded = ko.observable(!!this.tile.data[this.node.id]())
    this.valueString = ko.observable(this.tile.data[this.node.id]() ? this.tile.data[this.node.id]() : 'loading...')
    this.iconClass = ko.observable(this.permittedToSign() ? (this.isUserAdded() ? 'fa fa-check' : 'fa-plus-circle') : 'fa fa-code')
    this.textClass = ko.observable(this.isUserAlreadyAdded ? '' : 'cons-type')

    this.setValue = () => {
      if (this.tile.data[this.node.id]()) {
        this.tile.data[this.node.id](null)
        this.iconClass('fa fa-plus-circle')
        this.textClass('cons-type')
      } else {
        this.tile.data[this.node.id]([{resourceId: this.personId()}])
        this.iconClass('fa fa-check')
        this.textClass('')
        }
    }

    this.tile.data[this.node.id].subscribe(data => {
      if (!data) {
        this.isUserAdded(false)
        this.iconClass(this.permittedToSign() ? 'fa-plus-circle' : 'fa fa-code')
      }
      this.isUserAdded(true)
      this.iconClass(this.permittedToSign() ? 'fa fa-check' : 'fa fa-code')
    })

    this.signOffGroups = params.signOffGroups ? params.signOffGroups : [] 

    this.getPersonId = async () => {
      const response = await $.ajax({
        type: 'GET',
        url: '/user-to-model',
        dataType: 'json',
        context: this,
        error: (response, status, error) => {
          console.error(response, status, error);
        }
      });
      if (response.person){
        const personId = response.person.resource_id
        this.personId(personId)
        return personId
      }
      return false
    }

    this.getName = async () => {
      const personId = this.personId() ? this.personId() : await this.getPersonId()
      if (!personId) {
        this.valueString("User is not linked to a specific person")
        return "User is not linked to a specific person"
      }
      const name = await $.ajax({
        type: 'GET',
        url: `/resource/descriptors/${personId}`,
        dataType: 'json',
        context: this,
        error: (response, status, error) => {
          console.error(response, status, error);
        }
      })
      this.name(name.displayname)
      this.valueString(name.displayname)
      return name.displayname
    }

    this.validatePermission = async () => {
      const personId = this.personId() ? this.personId() : await this.getPersonId() 
      if (!personId) {
        return false
      }
      if (this.signOffGroups.length === 0) {
        this.permittedToSign(true)
        return true
      }
      const groups = await $.ajax({
        type: 'GET',
        url: `/search/resources?advanced-search=[{"op"%3A"and"%2C"bb2f7e1c-7029-11ee-885f-0242ac140008"%3A{"op"%3A""%2C"val"%3A["${personId}"]}}]`,
        dataType: 'json',
        context: this,
        error: (response, status, error) => {
          console.error(response, status, error);
        }
      })

      if (this.signOffGroups.length > 0) {
        groupIntersection = Array.from(new Set(groups.results.hits.hits.map(hit => hit._id)).intersection(new Set(this.signOffGroups)))
        this.permittedToSign(groupIntersection.length > 0)
        return groupIntersection.length > 0
      } 
      return false
    };

    this.initialize = async () => {
      const permitted = await this.validatePermission()
      if (permitted) {
        this.iconClass('fa fa-plus-circle')
        this.valueString(this.getName())
      } else {
        this.valueString('You do not have permission to sign off')
      }
    }
    if (!this.isUserAlreadyAdded) {
      this.initialize()
    } else {
      this.valueString(this.tile.data[this.node.id]()[0].resourceName())
      this.tile.data[this.node.id]()[0].resourceName.subscribe(name => {
        this.valueString(name)
      })
    }
  };

  /**
   * registers a sign-off component for use in forms
   * @function external:"ko.components".check-open-applications
   * @param {object} params
   * @param {string} params.value - the value being managed
   * @param {list} signOffGroups - groups which have permission to sign
   * @param {function} params.config - observable containing config object
   * @param {string} params.config().label - label to use alongside the text input
   * @param {string} params.config().placeholder - default text to show in the text input
   */
  return ko.components.register('user-to-model-select', {
    viewModel,
    template: template
  });
});
