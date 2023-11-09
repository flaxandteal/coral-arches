define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/excavation-site-visit.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/related-document-upload'
], function(ko, arches, Workflow, excavationSiteVisitTemplate) {
    return ko.components.register('asset-consent-application', {
        viewModel: function(params) {
            this.componentName = 'asset-consent-application';
            this.stepConfig = [
                {
                    title: 'Heritage Asset',
                    name: 'asset-select',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage Asset',
                        text: 'Select the Heritage Asset to which the application relates',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'selection', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '58a2b98f-a255-11e9-9a30-00224800b26d', //Visit Date & desc
                                        graphids: ['076f9381-7b00-11e9-8d6b-80000b44d1d9']
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'References',
                    name: 'heritage-asset-references',
                    workflowstepclass: 'workflow-form-component',
                    required: true,
                    informationboxdata: {
                        heading: 'Reference information ',
                        text: 'Please fill in the recieved date and any missing reference numbers',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'received-date', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '40eff4c9-893a-11ea-ac3a-f875a44e0e11', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Log Date", "Received Date"]
                                        ],
                                        hiddenNodes: [
                                            "40eff4ce-893a-11ea-ae2e-f875a44e0e11",
                                            "72244177-893a-11ea-99a1-f875a44e0e11",
                                            "7224417c-893a-11ea-9ac2-f875a44e0e11",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba",
                                            "7224417b-893a-11ea-b383-f875a44e0e11"
                                        ],
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'cm-ref', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '3b500555-eec2-11eb-b785-a87eeabdefba', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Cross Reference", "CM Reference"]
                                        ],
                                        hiddenNodes: [
                                            "3b50055a-eec2-11eb-9d5e-a87eeabdefba",
                                            "3b50055e-eec2-11eb-8f26-a87eeabdefba",
                                            "3b50055d-eec2-11eb-8bca-a87eeabdefba",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba"
                                        ],
                                        prefilledNodes: [
                                            ["3b50055e-eec2-11eb-8f26-a87eeabdefba", "19afd557-cc21-44b4-b1df-f32568181b2c"]
                                        ]
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'smr-no', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '3b500555-eec2-11eb-b785-a87eeabdefba', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Cross Reference", "SMR No(s)"]
                                        ],
                                        hiddenNodes: [
                                            "3b50055a-eec2-11eb-9d5e-a87eeabdefba",
                                            "3b50055e-eec2-11eb-8f26-a87eeabdefba",
                                            "3b50055d-eec2-11eb-8bca-a87eeabdefba",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba"
                                        ],
                                        prefilledNodes: [
                                            ["3b50055e-eec2-11eb-8f26-a87eeabdefba", "804a489a-be93-463b-b1f6-4f473b644279"]
                                        ]
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'consultation-name', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '4ad66f55-951f-11ea-b2e2-f875a44e0e11', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Log Date", "Received Date"]
                                        ],
                                        hiddenNodes: [
                                            "4ad69684-951f-11ea-b5c3-f875a44e0e11",
                                            "4ad66f59-951f-11ea-ab0a-f875a44e0e11",
                                            "4ad69681-951f-11ea-b8ab-f875a44e0e11",
                                            "4ad66f58-951f-11ea-9c61-f875a44e0e11",
                                        ],
                                        prefilledNodes: [
                                            ["4ad69684-951f-11ea-b5c3-f875a44e0e11", '{en: {value:"Heritage Asset Consent Application for GNR Main Line Belfast - Border", direction: "ltr"}}']
                                        ]
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'consultation-type', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '54de6acc-8895-11ea-9067-f875a44e0e11', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        labels: [
                                            ["Log Date", "Received Date"]
                                        ],
                                        hiddenNodes: [
                                            "54de6acc-8895-11ea-9067-f875a44e0e11",
                                            "4ad66f59-951f-11ea-ab0a-f875a44e0e11",
                                            "4ad69681-951f-11ea-b8ab-f875a44e0e11",
                                            "4ad66f58-951f-11ea-9c61-f875a44e0e11",
                                        ],
                                        prefilledNodes: [
                                            ["54de6acc-8895-11ea-9067-f875a44e0e11", "a2fce2b4-2baf-4270-bbf3-2c5999c38ecc"]
                                        ]
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Relevant Parties',
                    name: 'consent-contacts',
                    required: true,
                    informationboxdata: {
                        heading: 'Relevant Parties',
                        text: 'Select all applicants, occupiers of the Heritage Asset (if not the same as the applicant); and agents working on the application',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'contacts', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '4ea4a189-184f-11eb-b45e-f875a44e0e11', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        hiddenNodes: [
                                            "4ea4a197-184f-11eb-9152-f875a44e0e11",
                                            "b7304f4c-3ace-11eb-8884-f875a44e0e11",
                                            "4ea4a192-184f-11eb-a0d6-f875a44e0e11",
                                            "5fd6dc6c-d2c9-11ec-a72f-a87eeabdefba"
                                        ],
                                        labels: [
                                            ["Agent", "Agent(s)"],
                                            ["Owner", "Owners or Occupiers"]
                                        ]
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Proposal',
                    name: 'consent-proposal',
                    required: true,
                    informationboxdata: {
                        heading: 'Proposal',
                        text: 'Description of proposed works',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'proposed-works', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '1b0e15e9-8864-11ea-b5f3-f875a44e0e11', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        labels: [
                                            ["Proposal Description", "Description of proposed works"]
                                        ],
                                        hiddenNodes: [
                                            "f279c99d-887e-11ea-9dca-f875a44e0e11"
                                        ]
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Documents',
                    name: 'consent-proposal',
                    required: true,
                    informationboxdata: {
                        heading: 'Proposal',
                        text: 'List the documents and/or illustrations accompanying this application',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'related-document-upload',
                                    uniqueInstanceName: 'file-upload', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'a535a235-8481-11ea-a6b9-f875a44e0e11',
                                        nodegroupid: '7db68c6c-8490-11ea-a543-f875a44e0e11',
                                        resourceModelId:"['asset-select']['selection'][0]['resourceInstanceId']",
                                        resourceTileId: "['asset-select']['selection'][0]['tileId']",
                                        resourceModelDigitalObjectNodeGroupId: 'b3addca4-8882-11ea-acc1-f875a44e0e11'

                                    },
                                },
                            ],
                        },
                    ],
                },

            ]
            
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: excavationSiteVisitTemplate
    });
});