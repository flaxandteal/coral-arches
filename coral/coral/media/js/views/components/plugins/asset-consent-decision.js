define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/excavation-site-visit.htm',
    'viewmodels/workflow-step',
    'views/components/workflows/related-document-upload',
    'views/components/widgets/generic-select-resource'
], function(ko, arches, Workflow, excavationSiteVisitTemplate) {
    return ko.components.register('asset-consent-decision', {
        viewModel: function(params) {
            this.componentName = 'asset-consent-decision';
            this.stepConfig = [
                {
                    title: 'Select Application',
                    name: 'asset-select',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage Asset Consent Application',
                        text: 'Select the Heritage Asset Consent Application being decided on',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'generic-select-resource',
                                    uniqueInstanceName: 'selection', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '58a2b98f-a255-11e9-9a30-00224800b26d', //Visit Date & desc
                                        graphids: ['8d41e49e-a250-11e9-9eab-00224800b26d'],
                                        genericNodegroupId: '8d41e49f-a250-11e9-b6b3-00224800b26d'
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    title: 'Decision',
                    name: 'consent-decision',
                    required: true,
                    informationboxdata: {
                        heading: 'Heritage Asset Consent Decision',
                        text: 'Outline the outcome of the Consent Application.',
                    },
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'widget-labeller',
                                    uniqueInstanceName: 'selection', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '8d41e49e-a250-11e9-9eab-00224800b26d', //license graph
                                        nodegroupid: '8d41e49f-a250-11e9-b6b3-00224800b26d', //Visit Date & desc
                                        resourceid: "['asset-select']['selection']['resourceid']",
                                        labels: [
                                            ["Advice", "Decision Details (reasons and/or conditions)"],
                                            ["Advice Applied Start Date", "Decision Date"],
                                            ["Advice given by", "Decision made by"]
                                        ],
                                        hiddenNodes: [
                                            'f74b74e6-1850-11eb-b43e-f875a44e0e11',
                                            '56fa335d-06fa-11eb-8328-f875a44e0e11',
                                        ]
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