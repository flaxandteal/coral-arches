define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/default-card-util.htm'
], function (_, ko, koMapping, uuid, arches, widgetLabeller) {
  function viewModel(params) {
    const self = this;

    _.extend(this, params.form);
    self.tile()?.dirty.subscribe(function (val) {
      self.dirty(val);
    });
    self.tiles([self.tile()]);

    this.graphid = params.graphid;
    this.graphids = params.graphids ? params.graphids : [this.graphid];
    this.hiddenCard = params?.hiddenCard || false;

    this.hiddenCard = params?.hiddenCard || false;

    if (this.componentData.parameters.prefilledNodes) {
      this.componentData.parameters.prefilledNodes?.forEach((prefill) => {
        Object.keys(self.tile().data).forEach((node) => {
          if (node == prefill[0]) {
            self.tile().data[node](prefill[1]);
          }
        });
      });
    }

    this.card()
      ?.widgets()
      .forEach((widget) => {
        widget.graphids = this.graphids ? this.graphids : [this.graphid];
        params.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });

    params.form.save = async () => {
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        nodegroupId: self.tile().nodegroup_id
      });
      params.form.complete(true);
      params.form.saving(false);
    };

    params.form.saveMultiTiles = async () => {
      self.complete(false);
      self.saving(true);
      self.previouslyPersistedComponentData = [];

      let unorderedSavedData = ko.observableArray();

      self.tiles().forEach(function (tile) {
        tile.save(
          function (...args) {
            /* onFail */
            console.log('multi: onFail: ', args);
          },
          function (savedTileData) {
            unorderedSavedData.push(savedTileData);
          }
        );
      });

      self.tilesToRemove().forEach(function (tile) {
        tile.deleteTile(
          function (response) {
            self.alert(
              new AlertViewModel(
                'ep-alert-red',
                response.responseJSON.title,
                response.responseJSON.message,
                null,
                function () {
                  return;
                }
              )
            );
          },
          function () {
            self.tilesToRemove.remove(tile);
            if (self.tilesToRemove().length === 0) {
              self.complete(true);
              self.loading(true);
              self.saving(false);
            }
          }
        );
      });

      /**
       * Original version of this method that has been
       * overridden here didn't end the save if there
       * wasn't any tiles saved. Multi tile steps can
       * now progress if no data was provided.
       */
      if (self.tiles().length === 0) {
        self.complete(true);
        self.loading(true);
        self.saving(false);

        return;
      }

      var saveSubscription = unorderedSavedData.subscribe(function (savedData) {
        if (savedData.length === self.tiles().length) {
          self.complete(true);
          self.loading(true);
          self.saving(false);

          var orderedSavedData = self.tiles().map(function (tile) {
            return savedData.find(function (datum) {
              return datum.tileid === tile.tileid;
            });
          });

          self.savedData(orderedSavedData.reverse());

          saveSubscription.dispose(); /* self-disposing subscription only runs once */
        }
      });
    };
  }

  ko.components.register('default-card-util', {
    viewModel: viewModel,
    template: widgetLabeller
  });

  return viewModel;
});
