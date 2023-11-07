define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/assign-consultation-workflow.htm',
], function(ko, arches, Workflow, thatchRoofSurveyTemplate) {
    return ko.components.register('survey-thatch-roof-condition', {
        viewModel: function(params) {
            this.componentName = 'survey-thatch-roof-condition';
            this.stepConfig = [
                {
                    title: 'Initialise Survey',
                    name: 'surv-init',
                    class: 'show-only-details',
                    required: true,
                    informationboxdata: {
                        heading: 'Create a new survey',
                        text: 'Select the cm ref for this survey',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'system-ref', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                                        // resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                            ]
                        }
                    ]
                },
                {
                    title: 'Condition Details',
                    name: 'condition-details',
                    class: 'show-only-details',
                    workflowstepclass: 'workflow-form-component',
                    required: false,
                    informationboxdata: {
                        heading: 'Condition Details',
                        text: 'Detail the condition of the thatch roof',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'condition-extent', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                //         nodegroupid: '87d39b28-f44f-11eb-a8b6-a87eeabdefba',
                                //         resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                //     },
                                // },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'thatch-material', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '77e8f287-efdc-11eb-a790-a87eeabdefba',
                                        resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'risk-status', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '6af2a0cb-efc5-11eb-8436-a87eeabdefba',
                                        resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                            ]
                        }
                    ]
                },
                {
                    title: 'Building Information',
                    name: 'surv-init',
                    class: 'show-only-details',
                    workflowstepclass: 'workflow-form-component',
                    required: false,
                    informationboxdata: {
                        heading: 'Buliding information',
                        text: 'Location, uses and owners for this building',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'locality-admin', /* unique to step */
                                //     tilesManaged: 'many',
                                //     parameters: {
                                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                //         nodegroupid: '87d38725-f44f-11eb-8d4b-a87eeabdefba',
                                //         resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                //     },
                                // },
                                // { 
                                //     componentName: 'default-card',
                                //     uniqueInstanceName: 'irish-grid', /* unique to step */
                                //     tilesManaged: 'one',
                                //     parameters: {
                                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                //         nodegroupid: '87d39b2b-f44f-11eb-af5e-a87eeabdefba',
                                //         resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                //     },
                                // },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'monument-type', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '77e8f287-efdc-11eb-a790-a87eeabdefba',
                                        resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'current_use', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'b2133dda-efdc-11eb-ab07-a87eeabdefba',
                                        resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'owner-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'a1d4ee93-efc5-11eb-b117-a87eeabdefba',
                                        resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                            ]
                        }
                    ]
                },
                {
                    title: 'Images',
                    name: 'image-caption',
                    class: 'show-only-details',
                    required: false,
                    informationboxdata: {
                        heading: 'Caption and Image',
                        text: '',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'image-caption', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '46f25cd9-b6c7-11ea-8651-f875a44e0e11',
                                        resourceid: "['surv-init']['system-ref'][0]['resourceInstanceId']",
                                    },
                                },
                            ]
                        }
                    ]
                },
            ];
            
            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: thatchRoofSurveyTemplate
    });
});
