define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/owner-occupier-report-workflow/owner-occupier-report-init-step.htm',
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

    self.monumentSysRefTileId = params.form.savedData()?.monumentSysRefTileId;
    self.monumentLocTileId = params.form.savedData()?.monumentLocTileId;
    self.monumentConsultationRelationshipTileId =
      params.form.savedData()?.monumentConsultationRelationshipTileId;
    self.monumentResourceId = params.form.savedData()?.monumentResourceId;
    self.consultationNameTileId = params.form.savedData()?.consultationNameTileId;
    self.consultationNumberTileId = params.form.savedData()?.consultationNumberTileId;
    self.applicationId = '';

    self.consultationSysRefNodeId = 'c853846a-7948-42c8-a089-63ebe34b49e4';

    params.form.save = async () => {
      await self.tile().save(); // Resource ID has now been created and is in self.resourceId()

      /**
       * This is the ID generate by auto-generate-id. Not to
       * be confused with a resource instance id.
       */
      self.applicationId = self
        .tile()
        ?.data[self.consultationSysRefNodeId]?.[arches.activeLanguage]?.value();

      try {
        /**
         * Configuring the name is no longer needed as the consultation number
         * function will handle it. If we configured the name from here after
         * the function we would get a cardinality error.
         */
        let responses = [];
        const monumentResponse = await saveMonumentSystemRef();
        if (monumentResponse.ok) {
          responses = await Promise.all([
            // getConsultationRefTileId(),
            saveMonumentLocation(),
            saveRelationship()
          ]);
          if (responses.every((response) => response.ok)) {
            params.form.savedData({
              tileData: koMapping.toJSON(self.tile().data),
              tileId: self.tile().tileid,
              resourceInstanceId: self.tile().resourceinstance_id,
              nodegroupId: self.tile().nodegroup_id,
              monumentSysRefTileId: self.monumentSysRefTileId,
              monumentConsultationRelationshipTileId: self.monumentConsultationRelationshipTileId,
              monumentResourceId: self.monumentResourceId,
              monumentLocTileId: self.monumentLocTileId,
              consultationNumberTileId: self.consultationNumberTileId
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
              monumentResponse.responseJSON.title,
              monumentResponse.responseJSON.message,
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

    // const getConsultationRefTileId = async () => {
    //   const response = await window.fetch(
    //     arches.urls.api_resources(self.resourceId() + '?format=json&compact=false')
    //   );

    //   if (response.ok) {
    //     const data = await response.json();
    //     if (data.resource['External Cross References']) {
    //       const consultationNumberRef = data.resource['External Cross References'].find((ref) => {
    //         if (ref['External Cross Reference Source']['@value'] === 'Excavation') {
    //           return ref;
    //         }
    //       });
    //       self.consultationNumberTileId =
    //         consultationNumberRef['External Cross Reference Number']['@tile_id'];
    //     }
    //   }
    //   return response;
    // };

    const saveMonumentSystemRef = async () => {
      const monumentSystemRefTemplate = {
        data: {
          '4264ab14-eabf-11ed-9e22-72d420f37f11': {
            en: {
              value: self.applicationId,
              direction: 'ltr'
            }
          },
          '4264a844-eabf-11ed-9e22-72d420f37f11': '1992741b-cc36-4613-b04e-943fa8c9d6fa',
          '4264a3f8-eabf-11ed-9e22-72d420f37f11': '7346be23-bff6-42dc-91d0-7c5182aa0031',
          '4264ab14-eabf-11ed-9e22-72d420f37f11': {
            en: {
              direction: 'ltr',
              value: ''
            }
          },
          '4264a9a2-eabf-11ed-9e22-72d420f37f11': '1992741b-cc36-4613-b04e-943fa8c9d6fa',
          '4264a6c8-eabf-11ed-9e22-72d420f37f11': '7346be23-bff6-42dc-91d0-7c5182aa0031',
          '42649ca0-eabf-11ed-9e22-72d420f37f11': 0,
          '42649f7a-eabf-11ed-9e22-72d420f37f11': '1992741b-cc36-4613-b04e-943fa8c9d6fa',
          '42649e1c-eabf-11ed-9e22-72d420f37f11': '7346be23-bff6-42dc-91d0-7c5182aa0031'
        },
        nodegroup_id: '42635b60-eabf-11ed-9e22-72d420f37f11',
        parenttile_id: null,
        resourceinstance_id: null,
        tileid: null,
        sortorder: 0
      };

      if (!self.monumentSysRefTileId) {
        self.monumentSysRefTileId = uuid.generate();
      } else {
        monumentSystemRefTemplate.tileid = self.monumentSysRefTileId;
      }

      const monumentTile = await window.fetch(arches.urls.api_tiles(self.monumentSysRefTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(monumentSystemRefTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (monumentTile?.ok) {
        const monumentTileResult = await monumentTile.json();
        self.monumentSysRefTileId = monumentTileResult.tileid;
        self.monumentResourceId = monumentTileResult.resourceinstance_id;
        return monumentTile;
      }
    };

    const saveMonumentLocation = async () => {
      const monumentLocationTemplate = {
        data: {},
        nodegroup_id: '426401a0-eabf-11ed-9e22-72d420f37f11',
        parenttile_id: null,
        resourceinstance_id: self.monumentResourceId,
        tileid: null,
        sortorder: 0
      };

      if (!self.monumentLocTileId) {
        self.monumentLocTileId = uuid.generate();
      } else {
        monumentLocationTemplate.tileid = self.monumentLocTileId;
      }

      const monumentTile = await window.fetch(arches.urls.api_tiles(self.monumentLocTileId), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(monumentLocationTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (monumentTile?.ok) {
        const monumentTileResult = await monumentTile.json();
        self.monumentLocTileId = monumentTileResult.tileid;
        return monumentTile;
      }
    };

    // const saveConsultationName = async () => {
    //   const consultationNameNode = '59d6676c-48b9-11ee-84da-0242ac140007';
    //   const nameTemplate = {
    //     tileid: '',
    //     data: {
    //       '59d663f2-48b9-11ee-84da-0242ac140007': null,
    //       '59d66c4e-48b9-11ee-84da-0242ac140007': null,
    //       '59d66ab4-48b9-11ee-84da-0242ac140007': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
    //       '59d665c8-48b9-11ee-84da-0242ac140007': '8a96a261-cd79-48e2-9f12-74924c152b00',
    //       '59d6691a-48b9-11ee-84da-0242ac140007': 'a0e096e2-f5ae-4579-950d-3040714713b4',
    //       '59d66df2-48b9-11ee-84da-0242ac140007': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
    //       [consultationNameNode]: null
    //     },
    //     nodegroup_id: '59d65ec0-48b9-11ee-84da-0242ac140007',
    //     parenttile_id: null,
    //     resourceinstance_id: self.resourceId(),
    //     sortorder: 0
    //   };

    //   nameTemplate.data[consultationNameNode] = {
    //     en: {
    //       direction: 'ltr',
    //       value: 'Consultation ' + self.applicationId
    //     }
    //   };

    //   if (!self.consultationNameTileId) {
    //     self.consultationNameTileId = uuid.generate();
    //   } else {
    //     nameTemplate.tileid = self.consultationNameTileId;
    //   }

    //   const nameTile = await window.fetch(arches.urls.api_tiles(self.consultationNameTileId), {
    //     method: 'POST',
    //     credentials: 'include',
    //     body: JSON.stringify(nameTemplate),
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   });

    //   if (nameTile?.ok) {
    //     const nameTileResult = await nameTile.json();
    //     self.consultationNameTileId = nameTileResult.tileid;
    //     return nameTile;
    //   }
    // };

    const saveRelationship = async () => {
      const monumentNodeNodeGroup = '65ed4765-5f3a-4062-b730-47019f149f72';
      const consultationMonumentTileTemplate = {
        tileid: '',
        data: {
          [monumentNodeNodeGroup]: [
            {
              resourceId: self.monumentResourceId,
              ontologyProperty: '',
              inverseOntologyProperty: ''
            }
          ]
        },
        nodegroup_id: monumentNodeNodeGroup,
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        sortorder: 0
      };

      if (!self.monumentConsultationRelationshipTileId) {
        self.monumentConsultationRelationshipTileId = uuid.generate();
      } else {
        consultationMonumentTileTemplate.tileid = self.monumentConsultationRelationshipTileId;
      }

      const consultationTile = await window.fetch(
        arches.urls.api_tiles(self.monumentConsultationRelationshipTileId),
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(consultationMonumentTileTemplate),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (consultationTile?.ok) {
        const consultationTileResult = await consultationTile.json();
        self.monumentConsultationRelationshipTileId = consultationTileResult.tileid;
        return consultationTile;
      }
    };
  }

  ko.components.register('owner-occupier-report-init-step', {
    viewModel: viewModel,
    template: initialStep
  });
  return viewModel;
});
