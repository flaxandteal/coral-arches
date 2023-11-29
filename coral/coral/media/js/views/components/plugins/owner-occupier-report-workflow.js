define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/default-card-util',
  'views/components/workflows/owner-occupier-report-workflow/owner-occupier-report-init-step'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('owner-occupier-report-workflow', {
    viewModel: function (params) {
      this.componentName = 'owner-occupier-report-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Survey Owner Occupier',
          name: 'init-step',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'owner-occupier-report-init-step',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Report',
          name: 'report-step',
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'address', // Needs location tile id
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263e8e6-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'hb-ref-no',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'extent-of-listing',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'construction-date',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263a7fa-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'townland', // Needs location tile id
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263afc0-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'principle-former-use',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263a7fa-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'conservation-area',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'industrial-archae',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4264608c-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'vernacular', // Needs location tile id
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263e0a8-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'thatched',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42635282-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'related-monuments', // Needs added to monuments
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //     nodegroupid: ''
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'vacant', // Needs location tile id, also currently not working
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //     nodegroupid: '426430e4-eabf-11ed-9e22-72d420f37f11',
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                //     parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                //   }
                // },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'derelict', // Needs location tile id
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42635282-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'date-of-listing',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'date-of-de-listing',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'os-map-no', // Needs location tile id
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263d086-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'ig-ref', // Needs location tile id
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263fa3e-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['monumentLocTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'smr-monument-ref-no',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42635b60-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'smr-consultation-ref-no',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'owners',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'occupiers',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // }
              ]
            }
          ]
        },
        {
          title: 'Interior / Exterior Design',
          name: 'design-step',
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'ext-desc-and-setting',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'interior-desc',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                }
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'architects',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'owner-report-int-ext-design',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // }
              ]
            }
          ]
        },
        {
          title: 'Historical Information',
          name: 'historicial-step',
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'ext-desc-and-setting',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'listing-status-notes', // Criteria for listing
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'b2c47e8c-e04c-487f-b083-92687bcf20e9',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'architect-comments',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'historical-comments',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'evaluation-comments',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'replacements-and-alterations',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'is-inappropriate',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'general-comments',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'date-of-survey',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42637ea6-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['monumentResourceId']"
                  }
                }
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'architects',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'owner-report-int-ext-design',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '',
                //     nodegroupid: ''
                //   }
                // }
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
