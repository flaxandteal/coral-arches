define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/initial-step.htm',
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

    self.locTileId = params.form.savedData()?.locTileId;

    params.form.save = async () => {
      await self.tile().save(); // Resource ID has now been created and is in self.resourceId()

      /**
       * This is the ID generate by auto-generate-id. Not to
       * be confused with a resource instance id.
       */

      try {
        /**
         * Configuring the name is no longer needed as the license number
         * function will handle it. If we configured the name from here after
         * the function we would get a cardinality error.
         */
        console.log('resid', self.resourceId());
        let responses = [];

        const saveLocation = async () => {
          console.log('saving');
          console.log(self.resourceId());
          const locationTemplate = {
            data: {},
            nodegroup_id: '87d39b2e-f44f-11eb-9a4a-a87eeabdefba',
            parenttile_id: null,
            resourceinstance_id: self.resourceId(),
            tileid: null,
            sortorder: 0
          };
          console.log('templated');

          if (!self.locTileId) {
            self.locTileId = uuid.generate();
          } else {
            locationTemplate.tileid = self.locTileId;
          }
          console.log('locid', self.locTileId);
          const locationTile = await window.fetch(arches.urls.api_tiles(self.locTileId), {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(locationTemplate),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (locationTile?.ok) {
            const locationTileResult = await locationTile.json();
            self.actLocTileId = locationTileResult.tileid;
            return locationTile;
          }
        };
        const locationResponse = await saveLocation();
        if (locationResponse.ok) {
          console.log('ok');
          if (responses.every((response) => response.ok)) {
            console.log('in the if');
            params.form.savedData({
              tileData: koMapping.toJSON(self.tile().data),
              tileId: self.tile().tileid,
              resourceInstanceId: self.tile().resourceinstance_id,
              nodegroupId: self.tile().nodegroup_id,
              locTileId: self.locTileId
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
        }
      } catch {
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
  }

  ko.components.register('initial-step-monument', {
    viewModel: viewModel,
    template: initialStep
  });
  return viewModel;
});
