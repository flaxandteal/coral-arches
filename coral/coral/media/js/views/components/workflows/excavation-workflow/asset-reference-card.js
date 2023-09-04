define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/asset-reference-card.htm',
], function(_, ko, koMapping, uuid, arches, AlertViewModel, excavationAssetStepTemplate) {
    function viewModel(params) {

        self = this
        this.resValue = ko.observable().extend({ deferred: true });
        this.loading = params.loading;
        this.graphid = params.graphid;

        this.tileLoadedInEditor = ko.observable();
        this.tile = ko.observable();
        this.tiles = ko.observable();

        console.log(self.tile, "preamble", self.tile())
        console.log(this, self)

        this.clearEditor = function() {
            console.log(this.resValue())
            console.log(this, self)
            console.log(self.tile, "clear")
            self.tile().reset();
        };

        this.addOrUpdateTile = function() {
            console.log(this.resValue())
            console.log(self.tile, "addate")
            console.log(this, self)
            var tiles = self.tiles();
            self.tiles(null);

            /* breaks observable chain */ 
            var tileData = koMapping.fromJSON(
                koMapping.toJSON(self.tile().data)
            );

            var tileLoadedInEditor = self.tileLoadedInEditor();

            if (tileLoadedInEditor) {
                var index = _.findIndex(tiles, tileLoadedInEditor);
                
                if (index > -1) {
                    tileLoadedInEditor.data = tileData;
                    tiles[index] = tileLoadedInEditor;
                }

                
                self.tileLoadedInEditor(null);
            }
            else {
                var newTile = self.card().getNewTile(true);
                newTile.data = tileData;

                tiles.unshift(newTile);
            }

            self.tiles(tiles);
            self.tile().reset();
        };

        this.loadTileIntoEditor = function(data) {
            self.tileLoadedInEditor(data);

            var tile = self.tile();

            /* force the value of current tile data observables */ 
            Object.keys(tile.data).forEach(function(key) {
                if (ko.isObservable(tile.data[key])) {
                    tile.data[key](data.data[key]());
                }
            });
        };

        params.form.save = function() {
            console.log(self.tile, "save")
        };
    }
    ko.components.register('asset-reference-card', {
        viewModel: viewModel,
        template: excavationAssetStepTemplate
    });

    return viewModel;
});