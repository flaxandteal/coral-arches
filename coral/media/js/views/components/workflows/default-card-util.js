define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/cards/default.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.graphid = params.graphid;
    this.graphids = params.graphids ? params.graphids : [this.graphid];
    this.title = ko.observable(params?.title || '')

    if (this.form.componentData.parameters.prefilledNodes) {
      this.form.componentData.parameters.prefilledNodes?.forEach((prefill) => {
        Object.keys(this.form.tile().data).forEach((node) => {
          if (node == prefill[0]) {
            this.form.tile().data[node](prefill[1]);
          }
        });
      });
    }

    this.form
      .card()
      ?.widgets()
      .forEach((widget) => {
        widget.graphids = this.graphids ? this.graphids : [this.graphid];
        this.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });

    /**
     * Overridden function saveMultiTiles from WorkflowComponentAbstract.
     *
     * Fixes:
     *   - Saving when no tiles are added
     *   - Clearing local storage after removing a tile
     *     so the tile won't exist when the user
     *     returns to that step
     */
    this.form.saveMultiTiles = async () => {
      this.form.complete(false);
      this.form.saving(true);
      this.previouslyPersistedComponentData = [];

      /**
       * Original version of this method that has been
       * overridden here didn't end the save if there
       * wasn't any tiles saved. Multi tile steps can
       * now progress if no data was provided.
       */
      if (this.tiles().length === 0 && this.tilesToRemove().length === 0) {
        this.form.complete(true);
        this.form.loading(true);
        this.form.saving(false);

        return;
      }

      const unorderedSavedData = ko.observableArray();

      this.form.tiles().forEach((tile) => {
        tile.save(
          () => {
            /* onFail */
          },
          (savedTileData) => {
            unorderedSavedData.push(savedTileData);
          }
        );
      });

      this.form.tilesToRemove().forEach((tile) => {
        tile.deleteTile(
          (response) => {
            this.form.alert(
              new AlertViewModel(
                'ep-alert-red',
                response.responseJSON.title,
                response.responseJSON.message,
                null,
                () => {
                  return;
                }
              )
            );
          },
          () => {
            this.form.tilesToRemove.remove(tile);
            /**
             * This functionality wasn't needed
             */
            // if (this.tilesToRemove().length === 0) {
            //   //   this.complete(true);
            //   //   this.loading(true);
            //   //   this.saving(false);
            // }
          }
        );
      });

      if (!this.form.tiles().length) {
        this.form.complete(true);
        this.form.loading(true);
        this.form.saving(false);
        this.form.savedData([]);
      }

      const saveSubscription = unorderedSavedData.subscribe((savedData) => {
        if (savedData.length === this.form.tiles().length) {
          this.form.complete(true);
          this.form.loading(true);
          this.form.saving(false);

          const orderedSavedData = this.form.tiles().map((tile) => {
            return savedData.find((datum) => {
              return datum.tileid === tile.tileid;
            });
          });
          
          this.form.savedData(orderedSavedData.reverse());

          saveSubscription.dispose(); /* this-disposing subscription only runs once */
        }
      });
    };
  }

  ko.components.register('default-card-util', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
