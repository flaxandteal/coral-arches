define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/application-area.htm',
], function(ko, arches, Workflow, applicationAreaTemplate) {
    return ko.components.register('heritage-at-risk', {
        viewModel: function(params) {
            this.componentName = 'heritage-at-risk';
            this.stepConfig = [
                {
                    title: 'Heritage Identification',
                    name: 'heritage-id',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage Identification',
                        text: 'Provide a name for this heritage site',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'heritage-site-name', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '676d47f9-9c1c-11ea-9aa0-f875a44e0e11',
                                        renderContext: 'workflow',
                                    },
                                },
                            ]

                        }
                    ]
                },
                {
                    title: 'Heritage Location',
                    name: 'heritage-location',
                    required: false,
                    informationboxdata: {
                        heading: 'Heritage Location',
                        text: 'Which area is this designation referring to?',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'location', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '87d39b2e-f44f-11eb-9a4a-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['heritage-id']['heritage-site-name'][0]['resourceInstanceId']",

                                    },
                                }
                            ]

                        }
                    ]
                },
                {
                    title: 'Heritage Designation',
                    name: 'heritage-id',
                    workflowstepclass: 'workflow-form-component',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage Designation',
                        text: 'Detail the selected category for this site',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'designtion-status', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'b2133dda-efdc-11eb-ab07-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['heritage-id']['heritage-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'category-date', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '6af2a0cb-efc5-11eb-8436-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['heritage-id']['heritage-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'owner-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '9682621d-0262-11eb-ab33-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['heritage-id']['heritage-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                            ]

                        }
                    ]
                },
                {
                    title: 'Heritage References',
                    name: 'heritage-refs',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage References',
                        text: 'Additional references to help identify this designation',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'heritage-system-ref', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                                        renderContext: 'workflow',
                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'external-refs', /* unique to step */
                                    tilesManaged: 'many',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'f17f6581-efc7-11eb-b09f-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['heritage-id']['heritage-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                            ]

                        }
                    ]
                }
            ]

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: applicationAreaTemplate
    });
});
