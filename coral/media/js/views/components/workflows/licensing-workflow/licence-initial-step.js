define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/licence-initial-step.htm',
  'viewmodels/alert',
  'bindings/select2-query'
], function ($, _, ko, koMapping, uuid, arches, initialStep, AlertViewModel) {
  function viewModel(params) {
    const self = this;

    _.extend(this, params.form);

    self.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });
    self.pageVm = params.pageVm;

    self.actSysRefTileId = params.form.savedData()?.actSysRefTileId;
    self.activityLocationTileId = params.form.savedData()?.activityLocationTileId;
    self.actLicenceRelationshipTileId = params.form.savedData()?.actLicenceRelationshipTileId;
    self.actResourceId = params.form.savedData()?.activityResourceId;
    self.licenceNameTileId = params.form.savedData()?.licenceNameTileId;
    self.decisionTileId = params.form.savedData()?.decisionTileId;
    self.applicationDetailsTileId = params.form.savedData()?.applicationDetailsTileId;
    self.cmRefTileId = params.form.savedData()?.cmRefTileId;
    // self.licenceNumberTileId = params.form.savedData()?.licenceNumberTileId;
    self.applicationId = '';

    self.licenceSysRefNodeId = '991c49b2-48b6-11ee-85af-0242ac140007';
    self.applicationDetailsNodeGroup = '4f0f655c-48cf-11ee-8e4e-0242ac140007'

    params.form.save = async () => {
      await self.tile().save(); // Resource ID has now been created and is in self.resourceId()

      /**
       * This is the ID generate by auto-generate-id. Not to
       * be confused with a resource instance id.
       */
      const tile = ko.unwrap(self.tile);
      const localisedValue = ko.unwrap(tile.data?.[self.licenceSysRefNodeId])
      self.applicationId = ko.unwrap(localisedValue?.[arches.activeLanguage]?.value)

      try {
        /**
         * Configuring the name is no longer needed as the licence number
         * function will handle it. If we configured the name from here after
         * the function we would get a cardinality error.
         */
        let responses = [];
        const activityResponse = await saveActivitySystemRef();
        if (activityResponse.ok) {
          responses = await Promise.all([
            // getLicenceRefTileId(),
            saveActivityLocation(),
            saveRelationship(),
            saveDecisionTile(),
            saveApplicationDetailsTile(),
            saveCmRefTile()
          ]);
          if (responses.every((response) => response.ok)) {
            params.form.savedData({
              tileData: koMapping.toJSON(self.tile().data),
              tileId: self.tile().tileid,
              resourceInstanceId: self.tile().resourceinstance_id,
              nodegroupId: self.tile().nodegroup_id,
              actSysRefTileId: self.actSysRefTileId,
              actLicenceRelationshipTileId: self.actLicenceRelationshipTileId,
              activityResourceId: self.actResourceId,
              activityLocationTileId: self.activityLocationTileId,
              decisionTileId: self.decisionTileId,
              applicationDetailsTileId: self.applicationDetailsTileId,
              cmRefTileId: self.cmRefTileId,

              // licenceNumberTileId: self.licenceNumberTileId
            });
            params.form.complete(true);
            params.form.saving(false);
          } else {
            const failed = responses.find((response) => !response.ok);
            if (failed) {
              params.pageVm.alert(
                new AlertViewModel(
                  'ep-alert-red',
                  failed.responseJSON.title,
                  failed.responseJSON.message,
                  null,
                  function () {}
                )
              );
            }
          }
        } else {
          params.pageVm.alert(
            new AlertViewModel(
              'ep-alert-red',
              activityResponse.responseJSON.title,
              activityResponse.responseJSON.message,
              null,
              function () {}
            )
          );
        }
      } catch (error) {
        self.pageVm.alert(
          new AlertViewModel(
            'ep-alert-red',
            'Something went wrong',
            'During initialization a resource failed to send the requests required to setup the workflow. Please report the indcident.',
            null,
            function () {}
          )
        );
      }
    };

    // const getLicenceRefTileId = async () => {
    //   const response = await window.fetch(
    //     arches.urls.api_resources(self.resourceId() + '?format=json&compact=false')
    //   );

    //   if (response.ok) {
    //     const data = await response.json();
    //     if (data.resource['External Cross References']) {
    //       const licenceNumberRef = data.resource['External Cross References'].find((ref) => {
    //         if (ref['External Cross Reference Source']['@value'] === 'Excavation') {
    //           return ref;
    //         }
    //       });
    //       self.licenceNumberTileId =
    //         licenceNumberRef['External Cross Reference Number']['@tile_id'];
    //     }
    //   }
    //   return response;
    // };

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

    const saveActivityLocation = async () => {
      const actLocationTemplate = {
        data: {},
        nodegroup_id: 'a5416b49-f121-11eb-8e2c-a87eeabdefba',
        parenttile_id: null,
        resourceinstance_id: self.actResourceId,
        tileid: null,
        sortorder: 0
      };

      if (!self.activityLocationTileId) {
        self.activityLocationTileId = uuid.generate();
      } else {
        actLocationTemplate.tileid = self.activityLocationTileId;
      }

      const activityTile = await window.fetch(arches.urls.api_tiles(self.activityLocationTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(actLocationTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (activityTile?.ok) {
        const activityTileResult = await activityTile.json();
        self.activityLocationTileId = activityTileResult.tileid;
        return activityTile;
      }
    };

    const saveLicenceName = async () => {
      const licenceNameNode = '59d6676c-48b9-11ee-84da-0242ac140007';
      const nameTemplate = {
        tileid: '',
        data: {
          '59d663f2-48b9-11ee-84da-0242ac140007': null,
          '59d66c4e-48b9-11ee-84da-0242ac140007': null,
          '59d66ab4-48b9-11ee-84da-0242ac140007': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
          '59d665c8-48b9-11ee-84da-0242ac140007': '8a96a261-cd79-48e2-9f12-74924c152b00',
          '59d6691a-48b9-11ee-84da-0242ac140007': 'a0e096e2-f5ae-4579-950d-3040714713b4',
          '59d66df2-48b9-11ee-84da-0242ac140007': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
          [licenceNameNode]: null
        },
        nodegroup_id: '59d65ec0-48b9-11ee-84da-0242ac140007',
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      nameTemplate.data[licenceNameNode] = {
        en: {
          direction: 'ltr',
          value: 'Excavation Licence ' + self.applicationId
        }
      };

      if (!self.licenceNameTileId) {
        self.licenceNameTileId = uuid.generate();
      } else {
        nameTemplate.tileid = self.licenceNameTileId;
      }

      const nameTile = await window.fetch(arches.urls.api_tiles(self.licenceNameTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(nameTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (nameTile?.ok) {
        const nameTileResult = await nameTile.json();
        self.licenceNameTileId = nameTileResult.tileid;
        return nameTile;
      }
    };

    const saveDecisionTile = async () => {
      const tileTemplate = {
        tileid: '',
        data: {},
        nodegroup_id: '2749ea5a-48cb-11ee-be76-0242ac140007',
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      if (!self.decisionTileId) {
        self.decisionTileId = uuid.generate();
      } else {
        tileTemplate.tileid = self.decisionTileId;
      }

      const tile = await window.fetch(arches.urls.api_tiles(self.decisionTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(tileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (tile?.ok) {
        const tileJson = await tile.json();
        self.decisionTileId = tileJson.tileid;
        return tile;
      }
    };

    const saveApplicationDetailsTile = async () => {
      const tileTemplate = {
        tileid: '',
        data	: {
          '27740e7c-7118-11ef-af33-0242ac120006':	null,
          '777596ba-48cf-11ee-8e4e-0242ac140007':	"daa4cddc-8636-4842-b836-eb2e10aabe18",
          '8f87fdae-2d50-11ef-bbfd-0242ac120006':	null,
          '916b5e7e-48cf-11ee-8e4e-0242ac140007':	"6fbe3775-e51d-4f90-af53-5695dd204c9a",
          'a08ed94c-2d50-11ef-bbfd-0242ac120006':	null,
          'a79fedae-bad5-11ee-900d-0242ac180006':	"2e2703e4-4f19-47ca-842d-a45c8502a547",
          'aec103a2-48cf-11ee-8e4e-0242ac140007':	null,
          'b407df02-bad5-11ee-900d-0242ac180006':	"c9bc15cc-46fe-4d34-a530-a228854845c8",
          'ba8aab44-2d4d-11ef-bbfd-0242ac120006':	null,
          'c2f40174-5dd5-11ee-ae2c-0242ac120008':	null,
          'fd9b98a8-2d4d-11ef-bbfd-0242ac120006':	null,
          'ff3de496-7117-11ef-83a1-0242ac120006':	"d33327e8-2b9d-4bab-a07e-f0ded18ded3e"
        },
        nodegroup_id: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      if (!self.applicationDetailsTileId) {
        self.applicationDetailsTileId = uuid.generate();
      } else {
        tileTemplate.tileid = self.applicationDetailsTileId;
      }

      const tile = await window.fetch(arches.urls.api_tiles(self.applicationDetailsTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(tileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (tile?.ok) {
        const tileJson = await tile.json();
        self.applicationDetailsTileId = tileJson.tileid;
        return tile;
      }
    };

    const saveCmRefTile = async () => {
      const tileTemplate = {
        tileid: '',
        data: {
          'b84fb006-bad2-11ee-b3f2-0242ac180006': '6fbe3775-e51d-4f90-af53-5695dd204c9a',
          'b84fb182-bad2-11ee-b3f2-0242ac180006': null,
          'b84fb2fe-bad2-11ee-b3f2-0242ac180006': null,
          'b84fb466-bad2-11ee-b3f2-0242ac180006': 'daa4cddc-8636-4842-b836-eb2e10aabe18',
          'b84fb5e2-bad2-11ee-b3f2-0242ac180006': '19afd557-cc21-44b4-b1df-f32568181b2c'
        },
        nodegroup_id: 'b84fa9c6-bad2-11ee-b3f2-0242ac180006',
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      if (!self.cmRefTileId) {
        self.cmRefTileId = uuid.generate();
      } else {
        tileTemplate.tileid = self.cmRefTileId;
      }

      const tile = await window.fetch(arches.urls.api_tiles(self.cmRefTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(tileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (tile?.ok) {
        const tileJson = await tile.json();
        self.cmRefTileId = tileJson.tileid;
        return tile;
      }
    };

    const saveRelationship = async () => {
      const activityNodeNodeGroup = 'a9f53f00-48b6-11ee-85af-0242ac140007';
      const licenceActivityTileTemplate = {
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

      if (!self.actLicenceRelationshipTileId) {
        self.actLicenceRelationshipTileId = uuid.generate();
      } else {
        licenceActivityTileTemplate.tileid = self.actLicenceRelationshipTileId;
      }

      const licenceTile = await window.fetch(
        arches.urls.api_tiles(self.actLicenceRelationshipTileId),
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(licenceActivityTileTemplate),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (licenceTile?.ok) {
        const licenceTileResult = await licenceTile.json();
        self.actLicenceRelationshipTileId = licenceTileResult.tileid;
        return licenceTile;
      }
    };
  }

  ko.components.register('licence-initial-step', {
    viewModel: viewModel,
    template: initialStep
  });
  return viewModel;
});
