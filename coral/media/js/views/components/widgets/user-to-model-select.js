define([
  'jquery',
  'knockout',
  'arches',
  'uuid',
  'underscore',
  'viewmodels/card-component',
  'templates/views/components/widgets/user-to-model-select.htm',
  './user-to-model-config.json'
], function ($, ko, arches, uuid, _, CardViewModel, template, userToModelConfig) {
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
    this.iconClass = ko.observable(this.permittedToSign() ? (this.isUserAdded() ? 'fa fa-check' : 'fa-plus-circle') : 'fa fa-ban')
    this.textClass = ko.observable(this.isUserAlreadyAdded ? '' : 'cons-type')
    this.configGroups = params.widget.widgetLookup[params.widget.widget_id()].defaultconfig.signOffGroups;
    this.workflowName = params.form.workflow.componentName;

    // This finds the value of the observable as it differs in depth from a page refresh to pressing next
    this.defaultConfigGroups = ko.computed(() => {
      let value = this.configGroups;  
      while (ko.isObservable(value)) {
        value = value();
      }
      return value || userToModelConfig.signOffGroups;
    });

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

    this.checkConfigNodes = (nodeId) => {
        const config = this.defaultConfigGroups().find(node => {
          const workflowMatch = Array.isArray(node.workflow) 
            ? node.workflow.includes(this.workflowName)
            : node.workflow === this.workflowName;
          return workflowMatch && node.nodeId === nodeId;
        });
        let nodes = [];
        if(config){
          nodes = config.groups.map(group => group.id);
        }
        else {
          nodes = params.signOffGroups;
        }
        return nodes;
    }

    this.signOffGroups = this.checkConfigNodes(this.node.id)
    this.conflictNode = params.conflictNode ?? null; // check if user signed a different node that prevents sign off
    this.conflictAllowBlank = params.conflictAllowBlank ?? true; // allows signoff if the conflict node is not filled in

    this.fetchTileData = async(resourceId, nodeId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

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
        const groups = response.person.groups
        this.valueString(response.person.name)
        this.personId(personId)
        return groups
      }
      return false
    }

    this.checkConflictNode = async() => {
      // get from the nodegroup or fetch additional nodegroups
      if (this.conflictNode in this.tile.data){
        this.nodeValue = this.tile.data[this.conflictNode]();
      }
      else {
        const response = await this.fetchTileData(this.tile.resourceinstance_id, this.conflictNode);
        this.nodeValue = response[0].data[this.conflictNode]
      }
      if (!this.nodeValue) {
        this.permittedToSign(this.conflictAllowBlank);
        return this.conflictAllowBlank;
      }
      if (Array.isArray(this.nodeValue)){
        for (const item of this.nodeValue){
          if (item.resourceId === this.personId()){
            this.permittedToSign(false);
            return false
          }
        }  
      }
      return true
    }
    
    this.validatePermission = async () => {
      
      const groups = await this.getPersonId() ?? this.personId();

      if (!this.personId()) {
        return false
      }
      if (this.signOffGroups.length === 0) {
        this.permittedToSign(true)
        return true
      }

      if (this.signOffGroups.length > 0) {
        let allowSignOff = false
        this.groupIntersection = Array.from(new Set(groups).intersection(new Set(this.signOffGroups)))
        this.permittedToSign(this.groupIntersection.length > 0)
        allowSignOff = this.groupIntersection.length > 0
        if(this.conflictNode){
          allowSignOff = this.checkConflictNode();
        }
        return allowSignOff
      } 
      return false
    };

    this.initialize = async () => {
      const permitted = await this.validatePermission()
      if (permitted) {
        this.iconClass('fa fa-plus-circle')
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
