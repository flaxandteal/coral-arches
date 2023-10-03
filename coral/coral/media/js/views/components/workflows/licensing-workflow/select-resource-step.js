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
        this.actTile = ko.observable(this.tile())
        this.resourceValue.subscribe((val) => {
            console.log("licence", val)
        })
        this.actVal = ko.observable()
        this.actVal.subscribe((val) => {
            console.log("site", val)
            this.actTile().resourceinstance_id = val
            this.actTile().transactionId = this.workflowId;
            this.actTile().dirty.subscribe(function(dirty) {
            self.dirty(dirty)
            console.log("the tile",this.actTile())
            })

        })
        this.applicationID = ''
        this.searchString = `http://localhost:8000/search/resources?resource-type-filter=[{%22graphid%22%3A%22b9e0701e-5463-11e9-b5f5-000d3ab1e588%22%2C%22name%22%3A%22Person%22%2C%22inverted%22%3Afalse}]&advanced-search=[{%22op%22%3A%22and%22%2C%22e7d69602-9939-11ea-b514-f875a44e0e11%22%3A{%22op%22%3A%22eq%22%2C%22val%22%3A%22%22}%2C%22e7d69603-9939-11ea-9e7f-f875a44e0e11%22%3A{%22op%22%3A%22~%22%2C%22lang%22%3A%22en%22%2C%22val%22%3A%22${this.applicationID}%22}%2C%22e7d69604-9939-11ea-baef-f875a44e0e11%22%3A{%22op%22%3A%22~%22%2C%22lang%22%3A%22en%22%2C%22val%22%3A%22%22}}]`
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

        params.form.save = function() {
            self.tile().save().then(
                function(){
                    params.form.savedData({
                        tileData: koMapping.toJSON(self.tile().data),
                        resourceInstanceId: self.tile().resourceinstance_id,
                        tileId: self.tile().tileid,
                        nodegroupId: self.tile().nodegroup_id,
                    });
                    self.locked(true);
                    params.form.complete(true);
                    params.form.saving(false);
                }
            )
        };
        this.initilize();
    }

    ko.components.register('excavation-select-resource-step', {
        viewModel: viewModel,
        template: excavationSelectResourceStepTemplate
    });

    return viewModel;
});
