define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'templates/views/components/workflows/licensing-workflow/select-resource-step.htm',
], function(_, $, arches, ko, koMapping, excavationSelectResourceStepTemplate) {
    function viewModel(params) {
        _.extend(this, params.form);

        var self = this;
        this.graphids = params.graphids;
        this.resourceValue = ko.observable();
        // this.actTile = 
        console.log("card",this.card())
        console.log("tile", this.tile())
        console.log("this",this)
        this.resourceValue.subscribe((val) => {
            console.log("licence", val)
        })
        this.actVal = ko.observable()
        this.actVal.subscribe((val) => {
            console.log("site", val)

        })
        this.actResVal = ko.observable()
        
        
        console.log("init site", this.actVal())
        this.resourceValue.subscribe(val => {
            if (val){
                self.tile().resourceinstance_id = val;
            }
        })
        this.tile().transactionId = this.workflowId;
        this.tile().dirty.subscribe(function(dirty) {
            self.dirty(dirty)
        });

        this.initilize = function(){
            if (ko.unwrap(self.savedData)) {
                self.resourceValue(ko.unwrap(self.savedData).resourceInstanceId);
            }
        }

        this.fetchTileData = async (resourceId) => {
            const tilesResponse = await window.fetch(
              arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
            );
            const data = await tilesResponse.json();
            return data.tiles;
          }

        params.form.save = function() {
            self.tile().save().then(
                function(){
                    activityResourceId = self.tile().data['fbaebc8e-61ef-11ee-baf1-0242ac120004']()[0].resourceId()
                    activityTiles = self.fetchTileData(activityResourceId).then(val => {
                        suitableTiles = val.filter((tile) => tile.nodegroup === '5f00ef7e-9f63-11ea-9db8-f875a44e0e11')
                        console.log(val, suitableTiles)
                        if (suitableTiles.length === 0) {
                            activityTileId = ""
                        } else {
                            activityTileId = suitableTiles[0].tileid
                        }
                        console.log(activityTileId)
                    }
                    ).then(function () {
                        params.form.savedData({
                            tileData: koMapping.toJSON(self.tile().data),
                            resourceInstanceId: self.tile().resourceinstance_id,
                            tileId: self.tile().tileid,
                            nodegroupId: self.tile().nodegroup_id,
                            activityResourceId: activityResourceId,
                            activityTileId: activityTileId,
                            otherTileOptions: suitableTiles.map(x => x.tileid)
                        });
                        self.locked(true);
                        params.form.complete(true);
                        params.form.saving(false);
                    })
                }
            )
        };
        this.initilize();
    }

    ko.components.register('excavation-select-resource-step',
    {
        viewModel: viewModel,
        template: excavationSelectResourceStepTemplate
    });

    return viewModel;
});
