define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/flag-enforcement-workflow.htm',
  'views/components/workflows/flag-enforcement-workflow/flag-enforcement-summary',
  'views/components/workflows/default-card-util'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('flag-enforcement-workflow', {
    viewModel: function (params) {
      this.componentName = 'flag-enforcement-workflow';

      this.stepConfig = [
        {
          title: 'Selected Consultation',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    hiddenNodes: [
                      '6a94dbfc-2d16-4534-8e63-1cbb8d643335',
                      '0629475d-a758-4483-8481-8d68025a28a7'
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Enforcement',
          name: 'enforcement-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'case-ref',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                    semanticName: 'External Cross References',
                    hiddenNodes: [
                      // '52b4cd82-ada8-4ce8-844a-c5325b11e1a4', // external_cross_reference_description_type,
                      '879c793c-757f-42a4-8951-e6accc35de7e', // external_cross_reference_description,
                      '90b26978-7a09-40de-b0f1-f261fcfbb9b5' // url,
                      'a45c0772-01ab-4867-abb7-675f470fd08f', // external_cross_reference_source,
                      // 'ebf279de-8a54-408c-812a-7fc344253758', // external_cross_reference,
                      // 'f8dbcbe7-0c33-4d3c-a171-fd9852315976', // external_cross_reference_description_metatype
                    ],
                    labels: [['Cross Reference', 'Case Reference']],
                    prefilledNodes: [
                      [
                        [
                          'a45c0772-01ab-4867-abb7-675f470fd08f',
                          '42a754b1-d69d-40d7-ab5d-25b18a9e1fbe'
                        ]
                      ]
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'enforcement',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '8e5cdd80-7fc9-11ee-b550-0242ac130008',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '7ac11ed6-821b-11ee-8351-0242ac130008',
                      'edb66c0c-821b-11ee-9793-0242ac130008'
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Summary',
          name: 'summary-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'flag-enforcement-summary',
                  uniqueInstanceName: 'summary',
                  tilesManaged: 'none',
                  parameters: {
                    resourceid: "['init-step']['con-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        }
      ];

      EditableWorkflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
