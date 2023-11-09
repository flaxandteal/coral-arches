define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/excavation-site-visit.htm',
    'viewmodels/workflow-step',
], function(ko, arches, Workflow, excavationSiteVisitTemplate) {
    return ko.components.register('grants-workflow', {
        viewModel: function(params) {
            this.componentName = 'grants-workflow';

            this.stepConfig = [
                {
                    title: 'Site Visit Details',
                    name: 'excavation-site-init',
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
                                    uniqueInstanceName: 'visit', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd', //license graph
                                        nodegroupid: 'f1e707c6-61ed-11ee-baf1-0242ac120004', //Visit Date & desc
                                        graphids: ['cc5da227-24e7-4088-bb83-a564c4331efd']
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