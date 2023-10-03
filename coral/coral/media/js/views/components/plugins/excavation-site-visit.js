define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/excavation-site-visit.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/licensing-workflow/select-resource-step',
    'views/components/workflows/photo-gallery-step',
], function(ko, arches, Workflow, excavationSiteVisitTemplate) {
    return ko.components.register('excavation-site-visit', {
        viewModel: function(params) {
            this.componentName = 'excavation-site-visit';

            this.stepConfig = [
                {
                    title: 'Site Visit Details',
                    name: 'excavation-site-visit-details',
                    required: true,
                    informationboxdata: {
                        heading: 'Site Visit Details',
                        text: 'Select the Licence for the visit',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'excavation-select-resource-step',
                                    uniqueInstanceName: 'excavation-site-visit-details', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd', //license graph
                                        nodegroupid: 'eeaf01e4-61c5-11ee-bf10-0242ac120004', //Visit Date & desc
                                        graphids: ['cc5da227-24e7-4088-bb83-a564c4331efd']
                                    },
                                },
                            ],
                        },
                    ],
                },
                // {
                //     title: 'Site Visit Attendees',
                //     name: 'excavation-site-visit-attendees',
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 { 
                //                     componentName: 'default-card',
                //                     uniqueInstanceName: 'excavation-site-visit-attendees', /* unique to step */
                //                     tilesManaged: 'many',
                //                     parameters: {
                //                         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //                         nodegroupid: 'ab622f1f-a251-11e9-bda5-00224800b26d',
                //                         resourceid: "['excavation-site-visit-details']['excavation-site-visit-details']['resourceInstanceId']",
                //                         parenttileid: "['excavation-site-visit-details']['excavation-site-visit-details']['tileId']"
                //                     },
                //                 },
                //             ], 
                //         },
                //     ],
                //     informationboxdata: {
                //         heading: 'Site Visit Attendees',
                //         text: 'Add all attendees and click save and continue when done',
                //     },
                // },
                // {
                //     title: 'Site Visit Observations',
                //     name: 'excavation-site-visit-observations',
                //     required: false,
                //     informationboxdata: {
                //         heading: 'Site Visit Observations',
                //         text: 'Add the observations during the site visit',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 { 
                //                     componentName: 'default-card',
                //                     uniqueInstanceName: 'excavation-site-visit-observations', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //                         nodegroupid: 'a2b47f25-938d-11ea-82cb-f875a44e0e11',
                //                         resourceid: "['excavation-site-visit-details']['excavation-site-visit-details']['resourceInstanceId']",
                //                         parenttileid: "['excavation-site-visit-details']['excavation-site-visit-details']['tileId']"
                //                     },
                //                 },
                //             ], 
                //         },
                //     ],
                // },
                // {
                //     title: 'Recommendations',
                //     name: 'site-recommendations',
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 { 
                //                     componentName: 'default-card',
                //                     uniqueInstanceName: 'site-recommendations', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //                         nodegroupid: 'f5ecfbca-938b-11ea-865d-f875a44e0e11',
                //                         resourceid: "['excavation-site-visit-details']['excavation-site-visit-details']['resourceInstanceId']",
                //                         parenttileid: "['excavation-site-visit-details']['excavation-site-visit-details']['tileId']"
                //                     },
                //                 },
                //             ], 
                //         },
                //     ],
                //     required: false,
                //     informationboxdata: {
                //         heading: 'Recommendations',
                //         text: 'Add recommendations from the site visit',
                //     }
                // },
                // {
                //     title: 'Site Photos (Upload)',
                //     name: 'site-photos-upload',
                //     required: false,
                //     workflowstepclass: 'consultation-map-step',
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 { 
                //                     componentName: 'photo-gallery-step',
                //                     uniqueInstanceName: 'site-photos-upload', /* unique to step */
                //                     tilesManaged: 'one',
                //                     parameters: {
                //                         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //                         nodegroupid: '3a79a0dd-4535-11eb-b88f-f875a44e0e11',
                //                         resourceid: "['excavation-site-visit-details']['excavation-site-visit-details']['resourceInstanceId']",
                //                         parenttileid: "['excavation-site-visit-details']['excavation-site-visit-details']['tileId']"
                //                     },
                //                 },
                //             ], 
                //         },
                //     ],
                //     informationboxdata: {
                //         heading: 'Upload Site Photos',
                //         text: 'Upload photographs from the visit by dragging and dropping or clicking the button',
                //     }
                // },
                // {
                //     title: 'Site Visit Workflow Complete',
                //     name: 'excavation-site-visit-complete',
                //     informationboxdata: {
                //         heading: 'Workflow Complete: Review your work',
                //         text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over',
                //     },
                //     layoutSections: [
                //         {
                //             componentConfigs: [
                //                 { 
                //                     componentName: 'excavation-site-visit-final-step',
                //                     uniqueInstanceName: 'excavation-site-visit-final', /* unique to step */
                //                     tilesManaged: 'none',
                //                     parameters: {
                //                         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //                         resourceid: "['excavation-site-visit-details']['excavation-site-visit-details']['resourceInstanceId']",
                //                         parenttileid: "['excavation-site-visit-details']['excavation-site-visit-details']['tileId']"
                //                     },
                //                 },
                //             ], 
                //         },
                //     ],
                // }

            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
        },
        template: excavationSiteVisitTemplate
    });
});
