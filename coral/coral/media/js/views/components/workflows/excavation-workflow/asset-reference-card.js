define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/asset-reference-card.htm',
], function(_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, excavationAssetStepTemplate) {
    function viewModel(params) {
        
        console.log("prepara", params)
        _.extend(this, params.form);
        CardComponentViewModel.apply(this, [params]);

        this.card = params.card

        
        self = this
        this.resValue = ko.observable().extend({ deferred: true });
        this.loading = params.loading;
        this.graphid = params.graphid;
        
        this.tileLoadedInEditor = ko.observable();
        this.tile = ko.observable();
        console.log("PARAMBLES", params)
        console.log("Carambles", this.card)
        console.log("tumbles", this.card.getNewTile(true))
        console.log("cartimbles", this.card.tiles())


        console.log(this, self)

        console.log("this.resValue")

        

        this.save = function() {
            console.log("form", this.card.newTile.formData)
            console.log("data", this.card.newTile.data)
            console.log("what it should be", this.resValue())
            this.card.newTile.data['589d4dc7-edf9-11eb-9856-a87eeabdefba'](this.resValue())
            this.card.newTile.data['589d4dca-edf9-11eb-83ea-a87eeabdefba']({"en": {value: "An asset reference", direction: "ltr"}})
            Object.keys(this.card.newTile.data).forEach((node) => {
                try{
                    console.log(node)
                    console.log(this.card.newTile.data[node]())
                } catch {

                }
            })
            // console.log("exist?", this.card.newTile.data['589d4dc7-edf9-11eb-83ea-a87eeabdefba'])
            
            // console.log(this.card.newTile.data['589d4dc7-edf9-11eb-83ea-a87eeabdefba']())
            // this.card.newTile.data['589d4dc9-edf9-11eb-83ea-a87eeabdefba']({"en": {value: "a test not fo assets", direction: "ltr"}})
            // this.card.newTile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba']('blanka ballix')
            // console.log(this.card.newTile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba']({"en": {value: "a test not fo assets", direction: "ltr"}}))
            console.log("pre-save")
            this.card.newTile.save()
            console.log("post-save")
        };
    }
    ko.components.register('asset-reference-card', {
        viewModel: viewModel,
        template: excavationAssetStepTemplate
    });

    return viewModel;
});