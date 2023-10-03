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
        console.log("this",this)
        this.resourceValue.subscribe((val) => {
            console.log("licence", val)
        })
        this.actVal = ko.observable()
        this.actVal.subscribe((val) => {
            console.log("site", val)
            // this.actTile.resourceinstance_id = val
            // this.actTile.transactionId = this.workflowId;
            // console.log("the tile",this.actTile())
            // console.log("copied from", this.tile())

        })
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
