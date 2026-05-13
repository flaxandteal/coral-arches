import $ from 'jquery';
import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import componentTemplate from 'templates/views/components/workflows/workflow-builder-initial-step.htm';
import AlertViewModel from 'viewmodels/alert';
import select2Query from 'bindings/select2-query';

function viewModel(params) {
  const self = this;

  _.extend(self, params.form);
  self.parentTiles = ko.observable(params.form.savedData()?.parentTiles || {});
  self.tile().dirty.subscribe(function (val) {
    self.dirty(val);
  });
  self.params = params
  this.labels = params.labels || [];

  const hiddenNodes =
    params.hiddenNodes ?? params.form.componentData?.parameters?.hiddenNodes ?? [];

  const applyWidgetCustomisations = (widgets) => {
    if (!widgets) return;
    widgets.forEach((widget) => {
      if (hiddenNodes.indexOf(widget.node_id()) > -1) {
        widget.visible(false);
      }
      this.labels?.forEach(([prevLabel, newLabel]) => {
        if (widget.label() === prevLabel) {
          widget.label(newLabel);
        }
      });
    });
  };

  const card = params.form.card();
  if (card) {
    applyWidgetCustomisations(card.widgets());
    if (ko.isObservable(card.widgets)) {
      card.widgets.subscribe(applyWidgetCustomisations);
    }
  }
  params.form.save = async () => {
    const txnId = uuid.generate();
    try {
      self.tile().transactionId = txnId;
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
      $.ajax({
          type: "POST",
          url: arches.urls.transaction_reverse(txnId)
      });
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

export default viewModel;
