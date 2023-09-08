define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/condition-assessment.htm',
], function(ko, arches, Workflow, applicationAreaTemplate) {
    return ko.components.register('condition-assessment', {
        viewModel: function(params) {
            this.componentName = 'condition-assessment';
            this.stepConfig = [
                {
                    title: 'Assessment Information',
                    name: 'assessment-info',
                    required: true,
                    informationboxdata: {
                        heading: 'Assessment Information',
                        text: 'Provide details regarding the Condition Assessment.',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'condition-assessment-info', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '24398081-4a53-11e9-a929-000d3ab1e588',
                                        nodegroupid: '24398080-4a53-11e9-93f2-000d3ab1e588',
                                        renderContext: 'workflow',
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Location  Description',
                    name: 'location-description',
                    required: true,
                    informationboxdata: {
                        heading: 'Location Description',
                        text: 'Describe the condition assessment location',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                {
                                    componentName: 'default-card',
                                    uniqueInstanceName: 'location-description', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '42ce82f6-83bf-11ea-b1e8-f875a44e0e11',
                                        nodegroupid: 'faa0a425-94ff-11ea-8dea-f875a44e0e11',
                                        renderContext: 'workflow',
                                    },
                                },
                            ],
                        },
                    ],
                }
                // {
                //     title: 'Area Map',
                //     name: 'area-map',
                //     description: 'Draw (or select from the Development Area Overlay) the extent of...',
                //     required: true,
                //     workflowstepclass: 'consultation-map-step',
                //     informationboxdata: {
                //         heading: 'Application Area Map',
                //         text: 'Draw (or select from the development area overlay) the extent of the area',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 {
                //                     componentName: 'map-card',
                //                     uniqueInstanceName: 'area-map', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '24398081-4a53-11e9-a929-000d3ab1e588',
                //                         nodegroupid: '24398080-4a53-11e9-93f2-000d3ab1e588',
                //                         resourceid: "['assign-name']['app-area-name'][0]['resourceid']['resourceInstanceId']",
                //                     },
                //                 },
                //             ],
                //         },
                //     ],
                // }
                // {
                //     title: 'Related Monument',
                //     name: 'related-monument',
                //     required: false,
                //     informationboxdata: {
                //         heading: 'Related Heritage Resources',
                //         text: 'Select the other monuments, areas, or artefacts related to the current Application Area.',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 {
                //                     componentName: 'default-card',
                //                     uniqueInstanceName: 'related-heritage-resource', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '24398081-4a53-11e9-a929-000d3ab1e588',
                //                         nodegroupid: 'a93c73b4-83d4-11ea-80e6-f875a44e0e11',
                //                         resourceid: "['assign-name']['app-area-name'][0]['resourceid']['resourceInstanceId']",
                //                     },
                //                 },
                //             ],
                //         },
                //     ],
                // },
                // {
                //     title: 'Area Description',
                //     name: 'area-description',
                //     required: false,
                //     informationboxdata: {
                //         heading: 'Area Description',
                //         text: 'Describe the application area',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 {
                //                     componentName: 'default-card',
                //                     uniqueInstanceName: 'related-heritage-resource', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '24398081-4a53-11e9-a929-000d3ab1e588',
                //                         nodegroupid: '7a76715d-94fd-11ea-8481-f875a44e0e11',
                //                         resourceid: "['assign-name']['app-area-name'][0]['resourceid']['resourceInstanceId']",
                //                     },
                //                 },
                //             ],
                //         },
                //     ],
                // },
                // {
                //     title: 'Area Designations',
                //     name: 'area-designations',
                //     required: false,
                //     workflowstepclass: 'consultation-map-step',
                //     informationboxdata: {
                //         heading: 'Area Designations',
                //         text: 'Select the application Area designations',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 {
                //                     componentName: 'default-card',
                //                     uniqueInstanceName: 'related-heritage-resource', /* unique to step */
                //                     tilesManaged: 'many',
                //                     parameters: {
                //                         graphid: '24398081-4a53-11e9-a929-000d3ab1e588',
                //                         nodegroupid: '48f51523-efde-11eb-8285-a87eeabdefba',
                //                         resourceid: "['assign-name']['app-area-name'][0]['resourceid']['resourceInstanceId']",
                //                     },
                //                 },
                //             ],
                //         },
                //     ],
                // },
                // {
                //     title: 'Application Area Complete',
                //     name: 'application-area-complete',
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 {
                //                     componentName: 'app-area-final-step',
                //                     uniqueInstanceName: 'app-area-final', /* unique to step */
                //                     tilesManaged: 'none',
                //                     parameters: {
                //                         resourceid: "['assign-name']['app-area-name'][0]['resourceid']['resourceInstanceId']",
                //                         graphid: '24398081-4a53-11e9-a929-000d3ab1e588',
                //                     },
                //                 },
                //             ],
                //         },
                //     ],
                //     informationboxdata: {
                //         heading: 'Workflow Complete: Review your work',
                //         text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over',
                //     }
                // }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: applicationAreaTemplate
    });
});

