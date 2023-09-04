define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/initial-step.htm',
  'bindings/select2-query'
], function ($, _, ko, koMapping, uuid, arches, initialStep) {
  function viewModel(params) {
    var self = this;

    _.extend(this, params.form);

    self.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });

    this.pageVm = params.pageVm;

    this.actSysRefTileId = params.form.savedData()?.actSysRefTileId;
    this.actLicenseRelationshipTileId = params.form.savedData()?.actLicenseRelationshipTileId;
    this.actResourceId = params.form.savedData()?.actResourceId;

    params.form.save = async () => {
      await self.tile().save(); // Resource ID has now be created and is in this.resourceId()
      console.log('Initial step RID: ', this.resourceId());
      console.log('self tile: ', self.tile());
      console.log('self tile data: ', koMapping.toJSON(self.tile().data));

      /**
       * This is the ID generate by auto-generate-id. Not to 
       * be confused with a resource instance id.
       */
      const resource = await window.fetch(
        arches.urls.api_resources(ko.unwrap(this.resourceId())) + '?format=json'
      );
      const resourceData = await resource.json();
      const appId = resourceData?.resource?.['System Reference Numbers']?.['UUID']?.['ResourceID'];

      const actSystemRefTemplate = {
        data: {
          'e7d69603-9939-11ea-9e7f-f875a44e0e11': {
            en: {
              value: appId,
              direction: 'ltr'
            }
          },
          'e7d69609-9939-11ea-a06d-f875a44e0e11': '1992741b-cc36-4613-b04e-943fa8c9d6fa',
          'e7d6960c-9939-11ea-99e0-f875a44e0e11': '7346be23-bff6-42dc-91d0-7c5182aa0031',
          'e7d69604-9939-11ea-baef-f875a44e0e11': {
            en: {
              direction: 'ltr',
              value: ''
            }
          },
          'e7d6960a-9939-11ea-b292-f875a44e0e11': '1992741b-cc36-4613-b04e-943fa8c9d6fa',
          'e7d6960d-9939-11ea-875c-f875a44e0e11': '7346be23-bff6-42dc-91d0-7c5182aa0031',
          'e7d69602-9939-11ea-b514-f875a44e0e11': 0,
          'e7d69608-9939-11ea-8292-f875a44e0e11': '1992741b-cc36-4613-b04e-943fa8c9d6fa',
          'e7d6960b-9939-11ea-aed9-f875a44e0e11': '7346be23-bff6-42dc-91d0-7c5182aa0031'
        },
        nodegroup_id: 'e7d695ff-9939-11ea-8fff-f875a44e0e11',
        parenttile_id: null,
        resourceinstance_id: null,
        tileid: null,
        sortorder: 0
      };

      if (!self.actSysRefTileId) {
        self.actSysRefTileId = uuid.generate();
      } else {
        actSystemRefTemplate.tileid = self.actSysRefTileId;
      }

      const activityTile = await window.fetch(
        arches.urls.api_tiles(self.actSysRefTileId),
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(actSystemRefTemplate),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (activityTile?.ok) {
        const activityTileResult = await activityTile.json();
        self.actSysRefTileId = activityTileResult.tileid;
        self.actResourceId = activityTileResult.resourceinstance_id;

        const relationship = await saveRelationship();
        if (relationship.ok) {
          params.form.savedData({
            tileData: koMapping.toJSON(self.tile().data),
            tileId: self.tile().tileid,
            resourceInstanceId: self.tile().resourceinstance_id,
            nodegroupId: self.tile().nodegroup_id,
            actSysRefTileId: self.actSysRefTileId,
            actLicenseRelationshipTileId: self.actLicenseRelationshipTileId,
            actResourceId: self.actResourceId,
          });
          params.form.complete(true);
          params.form.saving(false);
        }
      }

    };

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
    this.digitalFileNodeTileId = params.form.savedData()?.digitalFileNodeTileId;

    console.log('related-document-upload ', this, self);

    // params.form.save = async () => {
    //   await self.tile().save();
    //   const digitalResourceNameTile = await saveDigitalResourceName();
    //   if (digitalResourceNameTile?.ok) {
    //     const relationship = await saveRelationship();
    //     if (relationship?.ok) {
    //       /**
    //        * Using the savedData method will allow you to configure parameters
    //        * that should be present if the user returns to this card after
    //        * saving the step.
    //        */
    //       params.form.savedData({
    //         tileData: koMapping.toJSON(self.tile().data),
    //         tileId: self.tile().tileid,
    //         resourceInstanceId: self.tile().resourceinstance_id,
    //         nodegroupId: self.tile().nodegroup_id,
    //         digitalResourceNameTileId: self.digitalResourceNameTileId,
    //         digitalFileNodeTileId: self.digitalFileNodeTileId
    //       });
    //       params.form.complete(true);
    //       params.form.saving(false);
    //     }
    //   }
    // };

    const saveDigitalResourceName = async () => {
      console.log('RESOURCE INS BEFORE SAVE NAME: ', self.resourceId());
      const nameTemplate = {
        tileid: '',
        data: {
          'c61ab166-9513-11ea-a44c-f875a44e0e11': null,
          'c61ab167-9513-11ea-9d50-f875a44e0e11': null,
          'c61ab168-9513-11ea-9980-f875a44e0e11': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
          'c61ab169-9513-11ea-b7c1-f875a44e0e11': '8a96a261-cd79-48e2-9f12-74924c152b00',
          'c61ab16a-9513-11ea-9afb-f875a44e0e11': 'a0e096e2-f5ae-4579-950d-3040714713b4',
          'c61ab16b-9513-11ea-ab9d-f875a44e0e11': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
          'c61ab16c-9513-11ea-89a4-f875a44e0e11': null
        },
        nodegroup_id: self.digitalResourceNameNodegroupId,
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      const resource = await window.fetch(
        arches.urls.api_resources(ko.unwrap(self.resourceModelId)) + '?format=json'
      );
      if (resource?.ok) {
        const resourceData = await resource.json();
        nameTemplate.data[self.digitalResourceNameNodeId] = {
          en: {
            direction: 'ltr',
            value: 'Files for ' + resourceData.displayname
          }
        };
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
          }
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

    const saveRelationship = async () => {
      /**
       * In the example of excavation license the `Files (D1)` nodegroup
       * has two identical uuids. One refers to the nodegroup and the other
       * to the node. This is used twice to provide the resource relationship.
       *
       * On line 171 it isn't necessary to wrap the object in an array for
       * resource-instance-list datatypes. It will automatically get covnerted
       * on the backend.
       *
       * This can be found in datatypes.py on line 2080.
       */
      const licenseTileTemplate = {
        tileid: '',
        data: {
          'a9f53f00-48b6-11ee-85af-0242ac140007': [
            {
              resourceId: self.actResourceId,
              ontologyProperty: '',
              inverseOntologyProperty: ''
            }
          ]
        },
        nodegroup_id: 'a9f53f00-48b6-11ee-85af-0242ac140007',
        parenttile_id: null,
        resourceinstance_id: self.resourceId,
        sortorder: 0
      };

      /**
       * Similar to the name tile this will generate or use the previous
       * tile id that was saved.
       */
      if (!self.actLicenseRelationshipTileId) {
        self.actLicenseRelationshipTileId = uuid.generate();
      } else {
        licenseTileTemplate.tileid = self.actLicenseRelationshipTileId;
      }

      const licenseTile = await window.fetch(arches.urls.api_tiles(self.actLicenseRelationshipTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(licenseTileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (licenseTile?.ok) {
        const licenseTileResult = await licenseTile.json();
        self.actLicenseRelationshipTileId = licenseTileResult.tileid;
        return licenseTile;
      }
    };
  }

  ko.components.register('initial-step', {
    viewModel: viewModel,
    template: initialStep
  });
  return viewModel;
});
