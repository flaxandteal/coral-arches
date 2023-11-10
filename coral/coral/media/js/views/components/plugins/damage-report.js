define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/excavation-site-visit.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/related-document-upload',
    'templates/views/components/widgets/generic-select-resource.htm',
], function(ko, arches, Workflow, excavationSiteVisitTemplate) {
    return ko.components.register('damage-report-workflow', {
        viewModel: function(params) {
            this.componentName = 'damage-report-workflow';
            this.stepConfig = [
                {
                    title: 'Heritage Asset',
                    name: 'asset-select',
                    workflowstepclass: 'workflow-form-component',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage Asset',
                        text: 'Select the Heritage Asset to which the application relates',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                
                                
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'selection', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //monument
                                        nodegroupid: '58a2b98f-a255-11e9-9a30-00224800b26d', //rel mon from consult
                                        graphids: ['076f9381-7b00-11e9-8d6b-80000b44d1d9'],
                                        genericNodegroupId: '58a2b98f-a255-11e9-9a30-00224800b26d',
                                        saveId: true
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Record of Incident',
                    name: 'heritage-asset-references',
                    workflowstepclass: 'workflow-form-component',
                    required: false,
                    informationboxdata: {
                        heading: 'Record of Incident ',
                        text: 'Please fill in the recieved date and any missing reference numbers',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'thatch-material', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '77e8f287-efdc-11eb-a790-a87eeabdefba',
                                        resourceid: "['asset-select']['selection'][0]['savedId']",
                                        hiddenNodes: [
                                            '77e8f298-efdc-11eb-9465-a87eeabdefba',
                                            '77e8f29c-efdc-11eb-a0ba-a87eeabdefba',
                                            '77e8f29f-efdc-11eb-a58e-a87eeabdefba',
                                            '77e8f291-efdc-11eb-9441-a87eeabdefba',
                                            '77e9065d-efdc-11eb-8bc3-a87eeabdefba',
                                            '77e8f28d-efdc-11eb-afe4-a87eeabdefba',
                                            '77e8f287-efdc-11eb-a790-a87eeabdefba',
                                            '77e8f292-efdc-11eb-acfd-a87eeabdefba',
                                            '77e8f293-efdc-11eb-ac31-a87eeabdefba',
                                            '77e8f29d-efdc-11eb-b890-a87eeabdefba',
                                            '77e9065e-efdc-11eb-baa2-a87eeabdefba',
                                            '77e8f290-efdc-11eb-8636-a87eeabdefba',
                                            '77e8f29e-efdc-11eb-a8d8-a87eeabdefba',
                                            '77e90834-efdc-11eb-b2b9-a87eeabdefba',
                                            '77e9065e-efdc-11eb-baa2-a87eeabdefba',
                                            '77e8f290-efdc-11eb-8636-a87eeabdefba',
                                            '77e8f28f-efdc-11eb-8e50-a87eeabdefba',
                                            '77e8f295-efdc-11eb-a593-a87eeabdefba',
                                            '77e8f29e-efdc-11eb-a8d8-a87eeabdefba',
                                            '77e8f28e-efdc-11eb-b9f5-a87eeabdefba',
                                            '77e8f294-efdc-11eb-a9a2-a87eeabdefba',
                                            '77e8f28a-efdc-11eb-9600-a87eeabdefba'
                                        ],
                                        labels: [
                                            ["Main Construction Material", "Material / Fabric Damaged"],

                                        ]
                                    },
                                },
                                // { 
                                //     componentName: 'widget-labeller',
                                //     uniqueInstanceName: 'risk-status', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                //         nodegroupid: '6af2a0cb-efc5-11eb-8436-a87eeabdefba',
                                //         resourceid: "['asset-select']['selection'][0]['savedId']",
                                //         hiddenNodes: [
                                //             "6af2b4b5-efc5-11eb-9977-a87eeabdefba",
                                //             "6af2b697-efc5-11eb-8152-a87eeabdefba",
                                //             "6af2b696-efc5-11eb-b0b5-a87eeabdefba",
                                //             "6af2a0ce-efc5-11eb-88d1-a87eeabdefba",
                                //             ""
                                //         ]
                                //     },
                                // },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'part-affected', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '8d41e4b7-a250-11e9-9b6c-00224800b26d', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Log Date", "Received Date"],
                                            ["Notes", "Part of heritage asset affected"]
                                        ],
                                        hiddenNodes: [
                                            "82b3ed68-8882-11ea-8ff6-f875a44e0e11",
                                            "72244177-893a-11ea-99a1-f875a44e0e11",
                                            "7224417c-893a-11ea-9ac2-f875a44e0e11",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba",
                                            "7224417b-893a-11ea-b383-f875a44e0e11"
                                        ],
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'damage-type', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '8d41e4b7-a250-11e9-9b6c-00224800b26d', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Log Date", "Received Date"],
                                            ["Notes", "Type of Damage"]
                                        ],
                                        hiddenNodes: [
                                            "82b3ed68-8882-11ea-8ff6-f875a44e0e11",
                                            "72244177-893a-11ea-99a1-f875a44e0e11",
                                            "7224417c-893a-11ea-9ac2-f875a44e0e11",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba",
                                            "7224417b-893a-11ea-b383-f875a44e0e11"
                                        ],
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'further-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '8d41e4b7-a250-11e9-9b6c-00224800b26d', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Log Date", "Received Date"],
                                            ["Notes", "Further details"]
                                        ],
                                        hiddenNodes: [
                                            "82b3ed68-8882-11ea-8ff6-f875a44e0e11",
                                            "72244177-893a-11ea-99a1-f875a44e0e11",
                                            "7224417c-893a-11ea-9ac2-f875a44e0e11",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba",
                                            "7224417b-893a-11ea-b383-f875a44e0e11"
                                        ],
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'special-arrangements', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '8d41e4b7-a250-11e9-9b6c-00224800b26d', //Visit Date & desc
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                        labels: [
                                            ["Log Date", "Received Date"],
                                            ["Notes", "Special arrangements required?"]
                                        ],
                                        hiddenNodes: [
                                            "82b3ed68-8882-11ea-8ff6-f875a44e0e11",
                                            "72244177-893a-11ea-99a1-f875a44e0e11",
                                            "7224417c-893a-11ea-9ac2-f875a44e0e11",
                                            "3b50055b-eec2-11eb-b4af-a87eeabdefba",
                                            "7224417b-893a-11ea-b383-f875a44e0e11"
                                        ],
                                    },
                                },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'condition-extent', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                //         nodegroupid: '87d39b28-f44f-11eb-a8b6-a87eeabdefba',
                                //         resourceid: "['asset-select']['selection'][0]['savedId']",
                                //     },
                                // },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'owner-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                                        nodegroupid: '4ea4a189-184f-11eb-b45e-f875a44e0e11',
                                        resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                        labels: [
                                            ["Planning Officer", "Issue Identified By"],
                                            ["Casework Officer", "Area Archeologist"],
                                            ["Agent", "CWT area supervisor"],
                                        ],
                                        hiddenNodes: [
                                            "5fd6dc6c-d2c9-11ec-a72f-a87eeabdefba",
                                            "4ea4a19a-184f-11eb-aef8-f875a44e0e11",
                                            "b7304f4c-3ace-11eb-8884-f875a44e0e11"
                                        ]
                                    },
                                },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'cm-ref', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //consult graph
                                        nodegroupid: '3b500555-eec2-11eb-b785-a87eeabdefba', //external cross
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
                                
                                
                                // {
                                //     componentName: 'widget-labeller',
                                //     uniqueInstanceName: 'smr-no', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                //         nodegroupid: '3b500555-eec2-11eb-b785-a87eeabdefba', //Visit Date & desc
                                //         resourceid: "['asset-select']['selection'][0]['resourceInstanceId']",
                                //         heritageAssetData: "['asset-select']['selection'][0]['tileData']",
                                //         labels: [
                                //             ["Cross Reference", "SMR No(s)"]
                                //         ],
                                //         hiddenNodes: [
                                //             "3b50055a-eec2-11eb-9d5e-a87eeabdefba",
                                //             "3b50055e-eec2-11eb-8f26-a87eeabdefba",
                                //             "3b50055d-eec2-11eb-8bca-a87eeabdefba",
                                //             "3b50055b-eec2-11eb-b4af-a87eeabdefba"
                                //         ],
                                //         prefilledNodes: [
                                //             ["3b50055e-eec2-11eb-8f26-a87eeabdefba", "804a489a-be93-463b-b1f6-4f473b644279"]
                                //         ]
                                //     },
                                // },
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
                    required: false,
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
                    required: false,
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
                    required: false,
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