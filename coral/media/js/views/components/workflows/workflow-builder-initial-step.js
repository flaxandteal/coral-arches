define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/workflow-builder-initial-step.htm',
  'viewmodels/alert',
  'bindings/select2-query'
], function ($, _, ko, koMapping, uuid, arches, componentTemplate, AlertViewModel) {
  function viewModel(params) {
    const self = this;

    _.extend(self, params.form);

    self.parentTiles = ko.observable(params.form.savedData()?.parentTiles || {});

    self.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });

    this.labels = params.labels || [];
    params.form
      .card()
      ?.widgets()
      .forEach((widget) => {
        this.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });

    params.form.save = async () => {
      try {
        await self.tile().save();

        if (!params.requiredParentTiles) {
          params.form.savedData({
            tileData: koMapping.toJSON(self.tile().data),
            tileId: self.tile().tileid,
            resourceInstanceId: self.tile().resourceinstance_id,
            nodegroupId: self.tile().nodegroup_id,
          });
          params.form.complete(true);
          params.form.saving(false);
          return;
        }
  
        const responses = await Promise.all(params.requiredParentTiles.map(self.saveParentTile));
  
        if (responses.every((response) => response.ok)) {
          params.form.savedData({
            tileData: koMapping.toJSON(self.tile().data),
            tileId: self.tile().tileid,
            resourceInstanceId: self.tile().resourceinstance_id,
            nodegroupId: self.tile().nodegroup_id,
            ...self.parentTiles()
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
      } catch (err) {
        console.log('caught error: ', err);
        params.pageVm.alert(new AlertViewModel(
          'ep-alert-red',
          err.responseJSON.title,
          err.responseJSON.message,
          null,
          function () {
            return;
          }
        ))
      }
    };

    self.saveParentTile = async ({ parentNodegroupId, lookupName }) => {
      const parentTileTemplate = {
        data: {},
        nodegroup_id: parentNodegroupId,
        parenttile_id: null,
        resourceinstance_id: self.resourceId(),
        tileid: null,
        sortorder: 0
      };

      if (!self.parentTiles()[lookupName]) {
        self.parentTiles()[lookupName] = uuid.generate();
      } else {
        parentTileTemplate.tileid = self.parentTiles()[lookupName];
      }

      const parentTile = await window.fetch(arches.urls.api_tiles(self.parentTiles()[lookupName]), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(parentTileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (parentTile?.ok) {
        const activityTileResult = await parentTile.json();
        self.parentTiles()[lookupName] = activityTileResult.tileid;
        return parentTile;
      }
    };
  }

  ko.components.register('workflow-builder-initial-step', {
    viewModel: viewModel,
    template: componentTemplate
  });
  return viewModel;
});
