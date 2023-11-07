define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/application-area.htm',
], function(ko, arches, Workflow, applicationAreaTemplate) {
    return ko.components.register('industrial-heritage-record', {
        viewModel: function(params) {
            this.componentName = 'industrial-heritage-record';
            this.stepConfig = [
                {
                    title: 'Industrial Heritage Record Identification',
                    name: 'ihr-instance',
                    required: true,
                    informationboxdata: {
                        heading: 'Industrial Heritage Record Identification',
                        text: 'Provide a name for this heritage site',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'ihr-site-name', /* unique to step */
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
                    title: 'Location',
                    name: 'ihr-location',
                    required: false,
                    informationboxdata: {
                        heading: 'IHR Location',
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
                                        resourceid: "['ihr-instance']['ihr-site-name'][0]['resourceInstanceId']",

                                    },
                                }
                            ]

                        }
                    ]
                },
                {
                    title: 'Information',
                    name: 'ihr-info',
                    workflowstepclass: 'workflow-form-component',
                    required: true,
                    informationboxdata: {
                        heading: 'IHR Information',
                        text: 'Please fill in relevant information',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'ihr-type', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '77e8f287-efdc-11eb-a790-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['ihr-instance']['ihr-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'ihr-desc', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['ihr-instance']['ihr-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'ihr-valuation', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: 'a1d4ee93-efc5-11eb-b117-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['ihr-instance']['ihr-site-name'][0]['resourceInstanceId']",

                                    },
                                },
                            ]

                        }
                    ]
                },
                {
                    title: 'Photos',
                    name: 'ihr-photo-step',
                    required: true,
                    informationboxdata: {
                        heading: 'IHR Photos',
                        text: 'Supplementary photos',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'ihr-photos', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                                        nodegroupid: '46f25cd9-b6c7-11ea-8651-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['ihr-instance']['ihr-site-name'][0]['resourceInstanceId']",

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
