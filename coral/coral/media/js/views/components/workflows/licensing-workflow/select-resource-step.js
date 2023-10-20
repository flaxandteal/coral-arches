define([
    'underscore',
    'jquery',
    'arches',
    'knockout',
    'knockout-mapping',
    'templates/views/components/workflows/licensing-workflow/select-resource-step.htm',
], function(_, $, arches, ko, koMapping, excavationSelectResourceStepTemplate) {
    function viewModel(params) {
        params.form.locked = ko.observable(false)
        _.extend(this, params.form);

        var self = this;
        this.graphids = params.graphids;
        this.resourceValue = ko.observable();
        this.actTile = ko.observable();
        this.actCard = ko.observable();


        this.archiveDisplayTiles = ko.observable()
        this.archiveTileId = ko.observable(null)
        this.resourceValue.subscribe((val) => {
        })
        this.actVal = ko.observable()
        this.actVal.subscribe((val) => {

        })
        this.actResVal = ko.observable()
        
        
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


        this.tile().data['fbaebc8e-61ef-11ee-baf1-0242ac120004'].subscribe(dat => {
            if (dat) {

                if (dat[0]){

                    console.log("dat problem",dat[0], dat)
                    if (ko.isObservable(dat[0].resourceId)){
                        siteResourceId = dat[0].resourceId()
                } else {
                    siteResourceId = dat[0].resourceId
                }
                self.fetchTileData(siteResourceId).then(data => {
                    archiveTiles = data.filter(x => x.nodegroup === "5f00ef7e-9f63-11ea-9db8-f875a44e0e11")
                    if (archiveTiles.length != 0) {
                        displayTiles = []
                        archiveTiles.forEach(async tile => {
                            displayTiles.push({
                                name : tile.data["cca6bed0-afd0-11ea-87f9-f875a44e0e11"].en.value,
                                buildingName: tile.data["cca6bed9-afd0-11ea-b0dc-f875a44e0e11"].en.value,
                                owner: tile.data["cca6bed8-afd0-11ea-b349-f875a44e0e11"][0]["resourceId"],
                                id: tile.tileid
                            })
                        })
                        this.archiveDisplayTiles(displayTiles)
                        
                        // this.archiveDisplayTiles(this.archiveDisplayTiles().map(x => { return {name: x.name, buildingName: x.buildingName, id: x.id, owner: self.updateName(x.owner)}}))
                    }
                })
            }
            }
        })
        this.updateTiles = async function (tileArray) {
            tileArray.foreach(async tile => {
                tile.owner = await self.updateName(tile.owner)
            }).then(function () {
                this.archiveDisplayTiles(tileArray)
            })

        }
        this.updateName = async function (nameid) {
            const name_response = await window.fetch(arches.urls.api_card + nameid)
            const data = await name_response.json()
            return data.displayname
        }
        this.removeArchive = function(thing) {
            this.archiveTileId(null)
        }
        this.selectArchive = function(thing) {
            this.archiveTileId(thing.id)
        }
        params.form.save = function() {
            self.tile().save().then(
                function(){
                    activityResourceId = self.tile().data['fbaebc8e-61ef-11ee-baf1-0242ac120004']()[0].resourceId()
                    activityTiles = self.fetchTileData(activityResourceId).then(val => {
                        suitableTiles = val.filter((tile) => tile.nodegroup === '5f00ef7e-9f63-11ea-9db8-f875a44e0e11')
                        
                    }
                    ).then(function () {
                        console.log("the id of it", self.archiveTileId())
                        params.form.savedData({
                            tileData: koMapping.toJSON(self.tile().data),
                            resourceInstanceId: self.tile().resourceinstance_id,
                            tileId: self.tile().tileid,
                            nodegroupId: self.tile().nodegroup_id,
                            activityResourceId: activityResourceId,
                            activityTileId: self.archiveTileId() || null,
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
