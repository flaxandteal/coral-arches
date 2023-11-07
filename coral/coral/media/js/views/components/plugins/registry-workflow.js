define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/application-area.htm',
], function(ko, arches, Workflow, applicationAreaTemplate) {
    return ko.components.register('registry-workflow', {
        viewModel: function(params) {
            this.componentName = 'registry-workflow';
            this.stepConfig = [
                {
                    title: 'Initialise Registry Entry',
                    name: 'init-entry',
                    required: true,
                    informationboxdata: {
                        heading: 'Initialise Entry',
                        text: 'Choose a source for the archive name',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'registry-name', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: '145f9615-9ad2-11ea-b4d3-f875a44e0e11',
                                        renderContext: 'workflow',
                                    },
                                },

                            ],
                        },
                    ],
                },
                {
                    title: 'File Descriptions',
                    name: 'file-descriptions',
                    workflowstepclass: 'workflow-form-component',
                    required: true,
                    informationboxdata: {
                        heading: 'File Descriptions',
                        text: 'Provide details for the file',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'entry-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: '145f9615-9ad2-11ea-b4d3-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['init-entry']['registry-name'][0]['resourceInstanceId']",
                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'creation-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: '66576cda-9b69-11ea-9143-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['init-entry']['registry-name'][0]['resourceInstanceId']",
                                    },
                                },

                            ],
                        },
                    ],
                },
                {
                    title: 'File References',
                    name: 'file-descriptions',
                    required: true,
                    informationboxdata: {
                        heading: 'File References',
                        text: 'Helpful References to improve findability',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'vol-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: 'e31709dd-b469-11ea-ae1c-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['init-entry']['registry-name'][0]['resourceInstanceId']",
                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'system-ref', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: '3bdc39f8-9a93-11ea-b807-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['init-entry']['registry-name'][0]['resourceInstanceId']",
                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'security-id', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: '93e7cded-eeb7-11eb-b194-a87eeabdefba',
                                        renderContext: 'workflow',
                                        resourceid: "['init-entry']['registry-name'][0]['resourceInstanceId']",
                                    },
                                },
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'master-id', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                                        nodegroupid: 'c69aa19d-fe7b-11ea-9e10-f875a44e0e11',
                                        renderContext: 'workflow',
                                        resourceid: "['init-entry']['registry-name'][0]['resourceInstanceId']",
                                    },
                                },

                            ],
                        },
                    ],
                },
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: applicationAreaTemplate
    });
});