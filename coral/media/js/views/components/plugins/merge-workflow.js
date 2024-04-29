define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/select-resource-id',
  'views/components/workflows/merge-workflow/submit-merge',
  'views/components/workflows/merge-workflow/heritage-asset-map'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('merge-workflow', {
    viewModel: function (params) {
      this.componentName = 'merge-workflow';
      this.stepConfig = [
        {
          title: 'Search',
          name: 'search-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Base Resource',
            text: 'The resource selected here will take priority during the merge. This means data groups that can only have one value will be overwritten with data groups kept in this resource.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-id',
                  uniqueInstanceName: 'base-record',
                  tilesManaged: 'none',
                  parameters: {
                    graphIds: [
                      '076f9381-7b00-11e9-8d6b-80000b44d1d9' // Monument
                    ],
                    label: 'Name/SMR of the Heritage Asset',
                    getTileIdFromNodegroup: [
                      {
                        nodegroupId: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                        lookupName: 'systemRef'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Merging',
          name: 'merging-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Merge Resource',
            text: 'Data from this resource will be merged into the base resource unless the base resource can only have one value for a data group.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-id',
                  uniqueInstanceName: 'merge-record',
                  tilesManaged: 'none',
                  parameters: {
                    graphIds: [
                      '076f9381-7b00-11e9-8d6b-80000b44d1d9' // Monument
                    ],
                    label: 'Name/SMR of the Heritage Asset',
                    getTileIdFromNodegroup: [
                      {
                        nodegroupId: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                        lookupName: 'systemRef'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Map of Locations',
          name: 'locations-step',
          required: false,
          workflowstepclass: 'full-height-map',
          informationboxdata: {
            displayed: true,
            heading: 'Geometry Locations',
            text: "Red represents the base resource. Blue represents the merge resource."
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'heritage-asset-map',
                  uniqueInstanceName: 'map-locations',
                  tilesManaged: 'none',
                  parameters: {
                    baseResourceId: "['search-step']['base-record'][0]['selectedResourceId']",
                    mergeResourceId: "['merging-step']['merge-record'][0]['selectedResourceId']",
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Information',
          name: 'information-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Please provide information',
            text: "It's mandatory that you provide information in the notes text box below detailing exactly why you think these two resources should be merged."
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'base-record-legacy-id',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['search-step']['base-record'][0]['selectedResourceId']",
                    nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                    tileid: "['search-step']['base-record'][0]['systemRef']",
                    hiddenNodes: [
                      '325a2f33-efe4-11eb-b0bb-a87eeabdefba',
                      '325a441c-efe4-11eb-9283-a87eeabdefba'
                      // '325a430a-efe4-11eb-810b-a87eeabdefba'
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'merge-record-legacy-id',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['merging-step']['merge-record'][0]['selectedResourceId']",
                    nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                    tileid: "['merging-step']['merge-record'][0]['systemRef']",
                    hiddenNodes: [
                      '325a2f33-efe4-11eb-b0bb-a87eeabdefba',
                      '325a441c-efe4-11eb-9283-a87eeabdefba'
                      // '325a430a-efe4-11eb-810b-a87eeabdefba'
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'notes',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'd9318eb6-f28d-427c-b061-6fe3021ce8aa',
                    nodegroupid: '5dff7478-ccdf-11ee-af2a-0242ac180006'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Approval',
          name: 'approval-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'report-updated-by',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'd9318eb6-f28d-427c-b061-6fe3021ce8aa',
                    nodegroupid: '3ff60eda-cce2-11ee-9264-0242ac180006',
                    resourceid:
                      "['information-step']['notes'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'reference-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'd9318eb6-f28d-427c-b061-6fe3021ce8aa',
                    nodegroupid: 'd31655e2-ccdf-11ee-9264-0242ac180006',
                    resourceid:
                      "['information-step']['notes'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'date-of-submission',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'd9318eb6-f28d-427c-b061-6fe3021ce8aa',
                    nodegroupid: '726951a8-cce0-11ee-af2a-0242ac180006',
                    resourceid:
                      "['information-step']['notes'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'submit-merge',
                  uniqueInstanceName: 'approval',
                  tilesManaged: 'none',
                  parameters: {
                    mergeTrackerResourceId:
                      "['information-step']['notes'][0]['resourceid']['resourceInstanceId']",
                    baseResourceId: "['search-step']['base-record'][0]['selectedResourceId']",
                    mergeResourceId: "['merging-step']['merge-record'][0]['selectedResourceId']"
                  }
                }
              ]
            }
          ]
        }
      ];

      OpenableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
