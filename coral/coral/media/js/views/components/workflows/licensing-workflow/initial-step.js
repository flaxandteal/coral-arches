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
    this.licenseNameTileId = params.form.savedData()?.licenseNameTileId;
    this.applicationId = '';

    console.log(params.form.savedData())

    this.licenseSysRefNodeId = '991c49b2-48b6-11ee-85af-0242ac140007';

    params.form.save = async () => {
      await self.tile().save(); // Resource ID has now been created and is in this.resourceId()

      /**
       * This is the ID generate by auto-generate-id. Not to
       * be confused with a resource instance id.
       */
      self.applicationId = self.tile()?.data[self.licenseSysRefNodeId][arches.activeLanguage]?.value();
      console.log('app id: ', self.applicationId);

      /**
       * TODO: Handle errors
       */
      const nameTile = await saveLicenseName();
      if (nameTile?.ok) {
        const activityTile = await saveActivitySystemRef();
        if (activityTile?.ok) {
          const relationship = await saveRelationship();
          if (relationship.ok) {
            params.form.savedData({
              tileData: koMapping.toJSON(self.tile().data),
              tileId: self.tile().tileid,
              resourceInstanceId: self.tile().resourceinstance_id,
              nodegroupId: self.tile().nodegroup_id,
              actSysRefTileId: self.actSysRefTileId,
              actLicenseRelationshipTileId: self.actLicenseRelationshipTileId,
              actResourceId: self.actResourceId
            });
            params.form.complete(true);
            params.form.saving(false);
            console.log("the data", params.form.savedData())

          }
        }
      }
    };

    const saveActivitySystemRef = async () => {
      const actSystemRefTemplate = {
        data: {
          'e7d69603-9939-11ea-9e7f-f875a44e0e11': {
            en: {
              value: self.applicationId,
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

      const activityTile = await window.fetch(arches.urls.api_tiles(self.actSysRefTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(actSystemRefTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (activityTile?.ok) {
        const activityTileResult = await activityTile.json();
        self.actSysRefTileId = activityTileResult.tileid;
        self.actResourceId = activityTileResult.resourceinstance_id;
        return activityTile;
      }
    };

    const saveLicenseName = async () => {
      const licenseNameNode = '59d6676c-48b9-11ee-84da-0242ac140007';
      const nameTemplate = {
        tileid: '',
        data: {
          '59d663f2-48b9-11ee-84da-0242ac140007': null,
          '59d66c4e-48b9-11ee-84da-0242ac140007': null,
          '59d66ab4-48b9-11ee-84da-0242ac140007': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
          '59d665c8-48b9-11ee-84da-0242ac140007': '8a96a261-cd79-48e2-9f12-74924c152b00',
          '59d6691a-48b9-11ee-84da-0242ac140007': 'a0e096e2-f5ae-4579-950d-3040714713b4',
          '59d66df2-48b9-11ee-84da-0242ac140007': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
          [licenseNameNode]: null
        },
        nodegroup_id: '59d65ec0-48b9-11ee-84da-0242ac140007',
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      nameTemplate.data[licenseNameNode] = {
        en: {
          direction: 'ltr',
          value: 'Excavation License ' + self.applicationId
        }
      };

      if (!self.licenseNameTileId) {
        self.licenseNameTileId = uuid.generate();
      } else {
        nameTemplate.tileid = self.licenseNameTileId;
      }

      const nameTile = await window.fetch(arches.urls.api_tiles(self.licenseNameTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(nameTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (nameTile?.ok) {
        const nameTileResult = await nameTile.json();
        self.licenseNameTileId = nameTileResult.tileid;
        return nameTile;
      }
    };

    const saveRelationship = async () => {
      const activityNodeNodeGroup = 'a9f53f00-48b6-11ee-85af-0242ac140007';
      const licenseActivityTileTemplate = {
        tileid: '',
        data: {
          [activityNodeNodeGroup]: [
            {
              resourceId: self.actResourceId,
              ontologyProperty: '',
              inverseOntologyProperty: ''
            }
          ]
        },
        nodegroup_id: activityNodeNodeGroup,
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      if (!self.actLicenseRelationshipTileId) {
        self.actLicenseRelationshipTileId = uuid.generate();
      } else {
        licenseActivityTileTemplate.tileid = self.actLicenseRelationshipTileId;
      }

      const licenseTile = await window.fetch(
        arches.urls.api_tiles(self.actLicenseRelationshipTileId),
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(licenseActivityTileTemplate),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

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
