define([
    "jquery",
    "knockout",
    "knockout-mapping",
    "arches",
    "uuid",
    "viewmodels/open-workflow",
    "templates/views/components/plugins/open-designation-workflow.htm",
], function($, ko, koMapping, arches, uuid, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function(params) {
        OpenWorkflow.apply(this, [params]);
        this.OPEN_WORKFLOW_CONFIG = "open-workflow-config";
        this.revisionTiles = ko.observableArray();
        this.selectedRevision = ko.observable();
        this.selectedHA = ko.observable();
        this.haRefNum = ko.observable();

        this.haSearchString = `/search/resources?resource-type-filter=[{"graphid":"076f9381-7b00-11e9-8d6b-80000b44d1d9","name":"Heritage Asset","inverted":false}]`;

        this.revisionSearchString = ko.computed(() => {
            let haRefNum = this.haRefNum();
            if(!haRefNum) haRefNum = "";
            return `/search/resources?advanced-search=[{"op":"and","52403903-9f4c-400f-81ce-09a5e8b9d925":{"op":"~","lang":"en","val":"${haRefNum}"},"147187c1-3319-4f6c-9cec-0c295164df14":{"op":"~","lang":"en","val":""},"469af519-d78e-46e2-b0bb-281bcab211d0":{"op":"eq","val":""}},{"op":"and","9e59e355-07f0-4b13-86c8-7aa12c04a5e3":{"val":"f"}},{"op":"or","9e59e355-07f0-4b13-86c8-7aa12c04a5e3":{"val":"null"}},{"op":"and","52403903-9f4c-400f-81ce-09a5e8b9d925":{"op":"~","lang":"en","val":"${haRefNum}"},"147187c1-3319-4f6c-9cec-0c295164df14":{"op":"~","lang":"en","val":""},"469af519-d78e-46e2-b0bb-281bcab211d0":{"op":"eq","val":""}}]`;
        });

        this.fetchTileData = async(resourceId, nodeId) => {
            const tilesResponse = await window.fetch(
                arches.urls.resource_tiles.replace(
                    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    resourceId
                ) + (nodeId ? `?nodeid=${nodeId}` : "")
            );
            const data = await tilesResponse.json();
            return data.tiles;
        };

        this.setupMonumentRevision = async() => {
            const monumentResourceId = this.selectedResource();
            const response = await $.ajax({
                type: "POST",
                url: "/remap-monument-to-revision",
                dataType: "json",
                data: JSON.stringify({
                    targetResourceId: monumentResourceId,
                }),
                context: this,
                error: (response, status, error) => {
                    console.log(response, status, error);
                },
            });
            const { started, ...message } = response;
            this.alert({ ...message });
        };

        this.startRemapAndOpen = async() => {
            await this.setupMonumentRevision();
            await this.openWorkflow();
        };

        this.getHaNumber = async(resourceId) => {
            // advance search doesn't work with a / so we are using the index number of the HA reference
            const tile = await this.fetchTileData(
                resourceId,
                "325a430a-efe4-11eb-810b-a87eeabdefba" // HA System Reference Node
            ); 
            return tile?.[0]?.data?.["325a430a-efe4-11eb-810b-a87eeabdefba"]?.['en']?.['value']?.split('/')[1] || "";        
        };

        this.selectedHA.subscribe(async(resourceId) => {
            if (!resourceId) {
                this.selectedResource(null);
                this.haRefNum("");
                return;
            }
            const haRefNumber = await this.getHaNumber(resourceId);
            console.log("REF", haRefNumber);
            this.haRefNum(haRefNumber);
            this.selectedResource(resourceId);
            this.revisionSearchString();
        });

        this.selectedRevision.subscribe((resourceId) => {
            if (!resourceId) {
                this.selectedResource(this.selectedHA());
                return;
            }
            this.selectedResource(resourceId);
        });
    };

    return ko.components.register("open-designation-workflow", {
        viewModel: openWorkflowViewModel,
        template: pageTemplate,
    });
});
