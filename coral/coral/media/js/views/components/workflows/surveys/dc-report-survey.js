define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/assign-consultation-workflow.htm',
], function(ko, arches, Workflow, dcReportSurveyTemplate) {
    return ko.components.register('survey-dc-report', {
        viewModel: function(params) {
            this.componentName = 'survey-dc-report';
            this.stepConfig = [
                {
                    title: 'DC Report Reference',
                    name: 'dc-cmref',
                    class: 'show-only-details',
                    required: true,
                    informationboxdata: {
                        heading: 'DC Report',
                        text: 'Select the cm ref for this survey',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'address', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '87d39b25-f44f-11eb-95e5-a87eeabdefba',

                                //     },
                                // },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'cm-ref', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                        nodegroupid: '42633a18-eabf-11ed-9e22-72d420f37f11',
                                        // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                    },
                                },
                            ]
                        }
                    ]
                },
                {
                    title: 'DC Report',
                    name: 'dc-report',
                    class: 'show-only-details',
                    workflowstepclass: 'workflow-form-component',
                    required: true,
                    informationboxdata: {
                        heading: 'DC Report',
                        text: '',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'extent-of-listing', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                        nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                                        resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
                                    },
                                },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'date-of-construction', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                        nodegroupid: '4263a7fa-eabf-11ed-9e22-72d420f37f11',
                                        resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                    },
                                },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'current-building-use', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                //         nodegroupid: 'b2133dda-efdc-11eb-ab07-a87eeabdefba',
                                //         // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'former-building-use', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263a7fa-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'widget-labeller',
                                //     uniqueInstanceName: 'conservation-area', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'industrial-archaeology', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                        nodegroupid: '4264608c-eabf-11ed-9e22-72d420f37f11',
                                        resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                    },
                                },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'vernacular', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263e0a8-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'monument-status', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263e0a8-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'area-of-townscape-character', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                                //         nodegroupid: '066cb8f0-a251-11e9-85d5-00224800b26d',
                                //         // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'local-landscape-policy-area', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                                //         nodegroupid: '066cb8f0-a251-11e9-85d5-00224800b26d',
                                //         // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'vancant-status', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '426430e4-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'derelict-status', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                        nodegroupid: '42635282-eabf-11ed-9e22-72d420f37f11',
                                        resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                    },
                                },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'niea-evaluation', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                        nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                                        resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                    },
                                },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'date-of-listing', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'date-of-delisting', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'os-map-no', /* unique to step */
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4264388c-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'ig-ref', /* unique to step */
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4263fa3e-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'owner-category', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                                //         nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                                //     },
                                // },
                            ], 
                        },
                    ],
                },
                // {
                //     title: 'Monument Location',
                //     name: 'dc-location',
                //     class: 'show-only-details',
                //     required: true,
                //     informationboxdata: {
                //         heading: 'Monument Location',
                //         text: 'Add address information and location descriptors',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 { 
                //                     componentName: 'widget-labeller',
                //                     uniqueInstanceName: 'location-info', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //                         nodegroupid: '426401a0-eabf-11ed-9e22-72d420f37f11',
                //                         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
                //                     },
                //                 },
                //             ]
                //         }
                //     ]
                // },
                {
                    title: 'Building Information',
                    name: 'dc-location',
                    class: 'show-only-details',
                    required: true,
                    informationboxdata: {
                        heading: 'Building Information',
                        text: 'Description and overview of the building',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'building-info', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                                        // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
                                    },
                                },
                            ]
                        }
                    ]
                },
                {
                    title: 'Additional Information',
                    name: 'dc-location',
                    class: 'show-only-details',
                    required: true,
                    informationboxdata: {
                        heading: 'Additional Information',
                        text: '',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'building-info', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                                        // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
                                    },
                                },
                            ]
                        }
                    ]
                }

            ];
            
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: dcReportSurveyTemplate
    });
});
