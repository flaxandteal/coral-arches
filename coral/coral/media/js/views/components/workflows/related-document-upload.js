define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/related-document-upload.htm',
  'bindings/select2-query',
], function($, _, ko, koMapping, uuid, arches, uploadDocumentStepTemplate) {
  function viewModel(params) {
      var self = this;

      /**
       * Both of these values should come from the first card you initialized in
       * the workflow.
       */
      this.resourceModelId = ko.observable(ko.unwrap(params.resourceModelId));
      this.resourceTileId = params.resourceTileId;
      this.resourceModelDigitalObjectNodeGroupId = params.resourceModelDigitalObjectNodeGroupId;

      /**
       * The group id refers to the Digital Object name group.
       * The name node refers to the child node of the group that configures the name.
       */
      this.digitalResourceNameNodegroupId = 'c61ab163-9513-11ea-9bb6-f875a44e0e11';
      this.digitalResourceNameNodeId = 'c61ab16c-9513-11ea-89a4-f875a44e0e11';

      /**
       * If the resource was already configured in a previous step and the user returns
       * this value will be populated.
       */
      this.digitalResourceNameTileId = params.form.savedData()?.digitalResourceNameTileId;

      _.extend(this, params.form);

      self.tile().dirty.subscribe(function(val){
          self.dirty(val);
      });

      console.log('related-document-upload ', this, self)
      
      this.pageVm = params.pageVm;

      params.form.save = async() => {
          await self.tile().save();
          const digitalResourceNameTile = await saveDigitalResourceName();
          if (digitalResourceNameTile?.ok) {
              const consultationRelationship = await saveConsultationRelationship();
              if (consultationRelationship?.ok) {
                  params.form.savedData({
                      tileData: koMapping.toJSON(self.tile().data),
                      tileId: self.tile().tileid,
                      resourceInstanceId: self.tile().resourceinstance_id,
                      nodegroupId: self.tile().nodegroup_id,
                      digitalResourceNameTileId: self.digitalResourceNameTileId,
                  });
                  params.form.complete(true);
                  params.form.saving(false);
              }
          }
      };

      const saveDigitalResourceName = async() => {
          const nameTemplate = {
              'tileid': '',
              'data': {
                  'c61ab166-9513-11ea-a44c-f875a44e0e11': null,
                  'c61ab167-9513-11ea-9d50-f875a44e0e11': null,
                  'c61ab168-9513-11ea-9980-f875a44e0e11': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
                  'c61ab169-9513-11ea-b7c1-f875a44e0e11': '8a96a261-cd79-48e2-9f12-74924c152b00',
                  'c61ab16a-9513-11ea-9afb-f875a44e0e11': 'a0e096e2-f5ae-4579-950d-3040714713b4',
                  'c61ab16b-9513-11ea-ab9d-f875a44e0e11': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
                  'c61ab16c-9513-11ea-89a4-f875a44e0e11': null
              },
              'nodegroup_id': self.digitalResourceNameNodegroupId,
              'parenttile_id': null,
              'resourceinstance_id': self.resourceId(),
              'sortorder': 0
          };
          
          const resource = await window.fetch(arches.urls.api_resources(ko.unwrap(self.resourceModelId)) + '?format=json');
          if (resource?.ok) {
              const resourceData = await resource.json();
              nameTemplate.data[self.digitalResourceNameNodeId] = 'Files for ' + resourceData.displayname;
              /**
               * Check if the tile has already been saved and has a tile id assigned.
               */
              if (!self.digitalResourceNameTileId) {
                  self.digitalResourceNameTileId = uuid.generate();
              } else {
                  nameTemplate.tileid = self.digitalResourceNameTileId;
              }

              /**
               * Update or create  the tile with the information that was provided
               * when the save button was clicked.
               */
              const nameTile = await window.fetch(arches.urls.api_tiles(self.digitalResourceNameTileId), {
                  method: 'POST',
                  credentials: 'include',
                  body: JSON.stringify(nameTemplate),
                  headers: {
                      'Content-Type': 'application/json'
                  },
              });

              /**
               * If the tile was successfully created get the tile the id it was assigned
               * and the resourceinstance_id. Taking the ri_id will allow it to be used
               * to create the relationship.
               */
              if (nameTile?.ok) {
                  const nameTileResult = await nameTile.json();
                  self.digitalResourceNameTileId = nameTileResult.tileid;
                  self.resourceId(nameTileResult.resourceinstance_id);
                  return nameTile;
              }
          }
      };

      const saveConsultationRelationship = async() =>  {
          // Add relationship from the digital object to the 'existing' communication tile
          var relatedDigitalResourceRelationship = JSON.stringify([{
              resourceId: self.resourceId(),
              ontologyProperty: '',
              inverseOntologyProperty:'',
              resourceXresourceId:''
          }]);

          let formData = new window.FormData();
          formData.append('resourceinstanceid', ko.unwrap(self.resourceModelId));
          formData.append('nodeid', self.resourceModelDigitalObjectNodeGroupId);
          formData.append('data', relatedDigitalResourceRelationship);
          formData.append('tileid', ko.unwrap(self.resourceTileId));

          return await window.fetch(arches.urls.api_node_value, {
              method: 'POST',
              credentials: 'include',
              body: formData,
          });
      };
  }

  ko.components.register('related-document-upload', {
      viewModel: viewModel,
      template: uploadDocumentStepTemplate
  });
  return viewModel;
});
