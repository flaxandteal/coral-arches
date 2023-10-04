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
            // this.actTile.resourceinstance_id = val
            // this.actTile.transactionId = this.workflowId;
            // console.log("the tile",this.actTile())
            // console.log("copied from", this.tile())

        })
        this.actResVal = ko.observable()
        this.actCard = ko.observable({
            "showForm": ko.observable(false),
            "tiles": ko.observable([]),
            "showSummary": ko.observable(false),
            "isWritable": true,
            "model": {
                "get": function(){return {}},
                "name": function(){return ""}
                
            },
            "widgets": ko.observable([
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "4e4e344a-8861-423b-8656-8c58749aaca6",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name Type"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a3c3693-fe4c-11ea-b66e-f875a44e0e11",
                    "label": ko.observable("Storage Building Name Type"),
                    "node_id": ko.observable("cca6bed1-afd0-11ea-a4a2-f875a44e0e11"),
                    "sortorder": 4,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "a0e096e2-f5ae-4579-950d-3040714713b4",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name Metatype"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a41dbef-fe4c-11ea-9eaf-f875a44e0e11",
                    "label": ko.observable("Storage Building Name Metatype"),
                    "node_id": ko.observable("cca6bed3-afd0-11ea-ae2b-f875a44e0e11"),
                    "sortorder": 5,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "04a4c4d5-5a5e-4018-93aa-65abaa53fb53",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name Use Metatype"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a44e902-fe4c-11ea-9d96-f875a44e0e11",
                    "label": ko.observable("Storage Building Name Use Metatype"),
                    "node_id": ko.observable("cca6bed4-afd0-11ea-b4f4-f875a44e0e11"),
                    "sortorder": 7,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "5a88136a-bf3a-4b48-a830-a7f42000dd24",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name Currency Metatype"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a47cf29-fe4c-11ea-b68f-f875a44e0e11",
                    "label": ko.observable("Storage Building Name Currency Metatype"),
                    "node_id": ko.observable("cca6bed5-afd0-11ea-a6d5-f875a44e0e11"),
                    "sortorder": 9,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "2df285fa-9cf2-45e7-bc05-a67b7d7ddc2f",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name Use Type"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a4ab559-fe4c-11ea-a06e-f875a44e0e11",
                    "label": ko.observable("Storage Building Name Use Type"),
                    "node_id": ko.observable("cca6bed7-afd0-11ea-be6b-f875a44e0e11"),
                    "sortorder": 6,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "c513dfd9-a447-48e0-ae58-8723804aec07",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Area Name Type"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a4dc26d-fe4c-11ea-9a59-f875a44e0e11",
                    "label": ko.observable("Storage Area Name Type"),
                    "node_id": ko.observable("cca6becd-afd0-11ea-a812-f875a44e0e11"),
                    "sortorder": 11,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "a0e096e2-f5ae-4579-950d-3040714713b4",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Area Name Metatype"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a50a89f-fe4c-11ea-b992-f875a44e0e11",
                    "label": ko.observable("Storage Area Name Metatype"),
                    "node_id": ko.observable("cca6bece-afd0-11ea-9ebd-f875a44e0e11"),
                    "sortorder": 12,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "c2051d53-40e7-4a2d-a4b4-02a31da37fd1",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name Currency"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "2a538ef7-fe4c-11ea-8a4f-f875a44e0e11",
                    "label": ko.observable("Storage Building Name Currency"),
                    "node_id": ko.observable("cca6becf-afd0-11ea-a4c6-f875a44e0e11"),
                    "sortorder": 8,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": {
                            "en": {
                                "direction": "ltr",
                                "value": ""
                            }
                        },
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Area Name"),
                        "maxLength": null,
                        "placeholder": "Enter text",
                        "uneditable": false,
                        "width": "100%"
                    },
                    "id": "2a56c313-fe4c-11ea-b5e6-f875a44e0e11",
                    "label": ko.observable("Storage Area Name"),
                    "node_id": ko.observable("cca6bed0-afd0-11ea-87f9-f875a44e0e11"),
                    "sortorder": 10,
                    "visible": ko.observable(true),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000001"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultResourceInstance": [],
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Repository owner"),
                        "placeholder": ""
                    },
                    "id": "2a59e352-fe4c-11ea-ac10-f875a44e0e11",
                    "label": ko.observable("Repository owner"),
                    "node_id": ko.observable("cca6bed8-afd0-11ea-b349-f875a44e0e11"),
                    "sortorder": 2,
                    "visible": ko.observable(true),
                    "widget_id": ko.observable("ff3c400a-76ec-11e7-a793-784f435179ea"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": {
                            "en": {
                                "direction": "ltr",
                                "value": ""
                            }
                        },
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Storage Building Name"),
                        "maxLength": null,
                        "placeholder": "Enter text",
                        "uneditable": false,
                        "width": "100%"
                    },
                    "id": "2a5cc999-fe4c-11ea-9b2e-f875a44e0e11",
                    "label": ko.observable("Storage Building Name"),
                    "node_id": ko.observable("cca6bed9-afd0-11ea-b0dc-f875a44e0e11"),
                    "sortorder": 3,
                    "visible": ko.observable(true),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000001"),
                    "selected": ko.observable(true)
                },
                {
                    "card_id": "5f036506-9f63-11ea-a746-f875a44e0e11",
                    "config": {
                        "defaultValue": "48b0ffe8-d72c-4152-9e00-24910d60202d",
                        "i18n_properties": [
                            "placeholder"
                        ],
                        "label": ko.observable("Archive Source Metatype"),
                        "options": [],
                        "placeholder": "Select an option"
                    },
                    "id": "b617ea15-fe4b-11ea-a7c5-f875a44e0e11",
                    "label": ko.observable("Archive Source Metatype"),
                    "node_id": ko.observable("7d581fcc-fe4b-11ea-9f19-f875a44e0e11"),
                    "sortorder": 1,
                    "visible": ko.observable(false),
                    "widget_id": ko.observable("10000000-0000-0000-0000-000000000002"),
                    "selected": ko.observable(true)
                },
            ])
        })
        this.actTile = ko.observable({
            "cards": [],
            "dirty": ko.observable(false),
            "data": {
                "7d581fcc-fe4b-11ea-9f19-f875a44e0e11": ko.observable(""),
                "a6e37454-9f63-11ea-870d-f875a44e0e11": ko.observable([]),
                "cca6becd-afd0-11ea-a812-f875a44e0e11": ko.observable(""),
                "cca6bece-afd0-11ea-9ebd-f875a44e0e11": ko.observable(""),
                "cca6becf-afd0-11ea-a4c6-f875a44e0e11": ko.observable(""),
                "cca6bed0-afd0-11ea-87f9-f875a44e0e11": ko.observable({
                    "de": {"direction": "ltr",
                    "value": ""},
                    "el": {"direction": "ltr",
                    "value": ""},
                    "en": {"direction": "ltr",
                    "value": ""},
                    "en-US": {"direction": "ltr",
                    "value": ""},
                    "en-us": {"direction": "ltr",
                    "value": ""},
                    "fr": {"direction": "ltr",
                    "value": ""},
                    "pt": {"direction": "ltr",
                    "value": ""},
                    "ru": {"direction": "ltr",
                    "value": ""},
                    "zh": {"direction": "ltr",
                    "value": ""}
                }),
                "cca6bed1-afd0-11ea-a4a2-f875a44e0e11": ko.observable(""),
                "cca6bed3-afd0-11ea-ae2b-f875a44e0e11": ko.observable(""),
                "cca6bed4-afd0-11ea-b4f4-f875a44e0e11": ko.observable(""),
                "cca6bed5-afd0-11ea-a6d5-f875a44e0e11": ko.observable(""),
                "cca6bed7-afd0-11ea-be6b-f875a44e0e11": ko.observable(""),
                "cca6bed8-afd0-11ea-b349-f875a44e0e11": ko.observable([{"inverseOntologyProperty": "",
                "ontologyProperty": "",
                "resourceId": "",
                "resourceXresourceId": ""}]),
                "cca6bed9-afd0-11ea-b0dc-f875a44e0e11": ko.observable({
                    "de": {"direction": "ltr",
                    "value": ""},
                    "el": {"direction": "ltr",
                    "value": ""},
                    "en": {"direction": "ltr",
                    "value": ""},
                    "en-US": {"direction": "ltr",
                    "value": ""},
                    "en-us": {"direction": "ltr",
                    "value": ""},
                    "fr": {"direction": "ltr",
                    "value": ""},
                    "pt": {"direction": "ltr",
                    "value": ""},
                    "ru": {"direction": "ltr",
                    "value": ""},
                    "zh": {"direction": "ltr",
                    "value": ""}
                })
            },
                "display_values": [
                    {
                        "label": "Archive Source Type",
                    "nodeid": "a6e37454-9f63-11ea-870d-f875a44e0e11",
                    "value": ""},
                    {
                    "label": "Storage Building Name Type",
                    "nodeid": "cca6bed1-afd0-11ea-a4a2-f875a44e0e11",
                    "value": "Repository Name"},
                    {
                    "label": "Storage Building Name Metatype",
                    "nodeid": "cca6bed3-afd0-11ea-ae2b-f875a44e0e11",
                    "value": "Name Type"},
                    {
                    "label": "Storage Building Name Use Metatype",
                    "nodeid": "cca6bed4-afd0-11ea-b4f4-f875a44e0e11",
                    "value": "Name Use Type"},
                    {
                    "label": "Storage Building Name Currency Metatype",
                    "nodeid": "cca6bed5-afd0-11ea-a6d5-f875a44e0e11",
                    "value": "Currency Type"},
                    {
                    "label": "Storage Building Name Use Type",
                    "nodeid": "cca6bed7-afd0-11ea-be6b-f875a44e0e11",
                    "value": "Primary"},
                    {
                    "label": "Repository owner",
                    "nodeid": "cca6bed8-afd0-11ea-b349-f875a44e0e11",
                    "value": ""},
                    {
                    "label": "Storage Building Name",
                    "nodeid": "cca6bed9-afd0-11ea-b0dc-f875a44e0e11",
                    "value": ""},
                    {
                    "label": "Archive Source Metatype",
                    "nodeid": "7d581fcc-fe4b-11ea-9f19-f875a44e0e11",
                    "value": "Information Object Type"},
                    {
                    "label": "Storage Area Name Type",
                    "nodeid": "cca6becd-afd0-11ea-a812-f875a44e0e11",
                    "value": "Storage Area Name"},
                    {
                    "label": "Storage Area Name Metatype",
                    "nodeid": "cca6bece-afd0-11ea-9ebd-f875a44e0e11",
                    "value": "Name Type"},
                    {
                    "label": "Storage Building Name Currency",
                    "nodeid": "cca6becf-afd0-11ea-a4c6-f875a44e0e11",
                    "value": "Current"},
                    {
                    "label": "Storage Area Name",
                    "nodeid": "cca6bed0-afd0-11ea-87f9-f875a44e0e11",
                    "value": ""
                }
            ],
                "nodegroup": "5f00ef7e-9f63-11ea-9db8-f875a44e0e11",
                "parenttile": null,
                "provisionaledits": null,
                "resourceinstance": "",
                "sortorder": 0,
                "tileid": ""}
        )
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

    ko.components.register('excavation-select-resource-step',
    {
        viewModel: viewModel,
        template: excavationSelectResourceStepTemplate
    });

    return viewModel;
});
