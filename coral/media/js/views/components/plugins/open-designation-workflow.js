import $ from 'jquery';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import OpenWorkflow from 'viewmodels/open-workflow';
import pageTemplate from 'templates/views/components/plugins/open-designation-workflow.htm';

const openWorkflowViewModel = function(params) {
    OpenWorkflow.apply(this, [params]);
    this.OPEN_WORKFLOW_CONFIG = "open-workflow-config";
    this.revisionTiles = ko.observableArray();
    this.selectedRevision = ko.observable();
    this.selectedHA = ko.observable();

    this.haSearchString = `/search/resources?resource-type-filter=[{"graphid":"076f9381-7b00-11e9-8d6b-80000b44d1d9","name":"Heritage Asset","inverted":false}]`;

    // (parent_monument eq selected HA OR parent_monument is null) AND not soft-deleted.
    // parent_monument and soft_deleted are separate tiles, so each term needs its own
    // advanced-search group - combining two nodes in one group nests both under the
    // same tile and never matches. Expanded out, that's 4 and/or chains of 2 groups each.
    this.revisionSearchString = ko.computed(() => {
        const haId = this.selectedHA();
        if (!haId) return "";
        const parentEq = `"6375be6e-dc64-11ee-924e-0242ac120006":{"op":"","val":["${haId}"]}`;
        const softFalse = `"9e59e355-07f0-4b13-86c8-7aa12c04a5e3":{"val":"f"}`;
        const softNull = `"9e59e355-07f0-4b13-86c8-7aa12c04a5e3":{"val":"null"}`;
        return `/search/resources?advanced-search=[`
            + `{"op":"and",${parentEq}},{"op":"and",${softFalse}},`
            + `{"op":"or",${parentEq}},{"op":"and",${softNull}}`
            + `]`;
    });

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

    this.selectedHA.subscribe((resourceId) => {
        if (!resourceId) {
            this.selectedResource(null);
            return;
        }
        this.selectedResource(resourceId);
    });

    this.selectedRevision.subscribe((resourceId) => {
        if (!resourceId) {
            this.selectedResource(this.selectedHA());
            return;
        }
        this.selectedResource(resourceId);
    });
};

export default ko.components.register("open-designation-workflow", {
        viewModel: openWorkflowViewModel,
        template: pageTemplate,
    });
