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
          // failed is a fetch Response, not a jQuery xhr - it has no
          // responseJSON, the body has to be read (and parsed) explicitly.
          const failedBody = await failed.json().catch(() => ({}));
          params.pageVm.alert(
            new AlertViewModel(
              'ep-alert-red',
              failedBody.title || 'Error',
              failedBody.message || 'Something went wrong saving this step.',
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
        err.responseJSON?.title || 'Error',
        err.responseJSON?.message || 'Something went wrong saving this step.',
        null,
        function () {
          return;
        }
      ))
    }
  };

  self.saveParentTile = async ({ parentNodegroupId, lookupName }) => {
    let tileAlreadyExists = Boolean(self.parentTiles()[lookupName]);

    if (!tileAlreadyExists) {
      // The client only knows about parent tiles created earlier in this
      // same workflow session. If this resource already has a tile for
      // this nodegroup from a previous session, reuse it instead of
      // blindly creating a second one and tripping the cardinality-1
      // nodegroup trigger.
      const cardData = await $.getJSON(arches.urls.api_card + self.resourceId());
      const existingTile = (cardData.tiles || []).find(
        (tile) => tile.nodegroup_id === parentNodegroupId
      );
      if (existingTile) {
        self.parentTiles()[lookupName] = existingTile.tileid;
        tileAlreadyExists = true;
      } else {
        self.parentTiles()[lookupName] = uuid.generate();
      }
    }

    const parentTileTemplate = {
      data: {},
      nodegroup_id: parentNodegroupId,
      parenttile_id: null,
      resourceinstance_id: self.resourceId(),
      // A non-null tileid tells the server this is an update to an
      // existing tile; sending one for a tile that has never been created
      // fails server-side (DoesNotExist), so it must stay null on genuine
      // first creation and let the server mint the id.
      tileid: tileAlreadyExists ? self.parentTiles()[lookupName] : null,
      sortorder: 0
    };

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
