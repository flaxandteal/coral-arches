define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/select-resource-id',
  'views/components/workflows/default-card-util'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('relate-two-monuments-workflow', {
    viewModel: function (params) {
      this.componentName = 'relate-two-monuments-workflow';
      this.stepConfig = [
        {
          title: 'Select Heritage Asset',
          name: 'target-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Target Heritage Asset',
            text: 'The monument selected here will be the Heritage Asset that is related to. The Heritage Asset selected on the second page will appear on this Heritage Asset.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-id',
                  uniqueInstanceName: 'target-record',
                  tilesManaged: 'none',
                  parameters: {
                    graphIds: [
                      '076f9381-7b00-11e9-8d6b-80000b44d1d9' // Monument
                    ],
                    label: 'Name/SMR of the Heritage Asset'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Associate Heritage Asset',
          name: 'relating-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'relating-record',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '055b3e3f-04c7-11eb-8d64-f875a44e0e11',
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Complete',
          name: 'complete-step',
          workflowstepclass: 'workflow-form-component',
          saveWithoutProgressing: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'association-date',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '35d8256a-d7d6-11ee-9916-0242ac120006',
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']",
                    parenttileid: "['relating-step']['relating-record'][0]['tileId']",
                    nodeOptions: {
                    "6694d802-37c0-11ef-a167-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "126c0042-dbc3-11ee-8835-0242ac120006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "35d84fea-d7d6-11ee-9916-0242ac120006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "ca07b860-2d5b-11ef-bbfd-0242ac120006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "ac25af94-1903-11ef-aa9c-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "98c42ca8-37be-11ef-a167-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "6522916e-efc8-11eb-8a9b-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "65227d22-efc8-11eb-b78e-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "6af2a0cf-efc5-11eb-806d-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "6af2b69b-efc5-11eb-8d5a-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "6af2b6a0-efc5-11eb-985a-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "d9368892-1902-11ef-aa9c-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "87d3c2a4-f44f-11eb-a170-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "87d3d7b6-f44f-11eb-a60d-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "87d3d7bc-f44f-11eb-b884-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "87d3d7b7-f44f-11eb-acd2-a87eeabdefba": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "96656e9c-d646-11ee-8b04-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "96826227-0262-11eb-a1c0-f875a44e0e11": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "e2815e0c-37bd-11ef-a167-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "d9bd0b80-d643-11ee-8b04-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "e8d511cc-d64c-11ee-8b04-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "eeec9e68-d23c-11ee-9373-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "82731030-37bf-11ef-a167-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "5253a3a8-37bd-11ef-a167-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "85396d94-37bc-11ef-9263-0242ac150006": {
                      "config":{
                        "maxDate":"today"
                      }
                    }
                  }
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'associated-by',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '76fc577c-d7d7-11ee-ade0-0242ac120006',
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']",
                    parenttileid: "['relating-step']['relating-record'][0]['tileId']",
                    nodeOptions: {
                      "6694d802-37c0-11ef-a167-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "126c0042-dbc3-11ee-8835-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "35d84fea-d7d6-11ee-9916-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ca07b860-2d5b-11ef-bbfd-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ac25af94-1903-11ef-aa9c-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "98c42ca8-37be-11ef-a167-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "6522916e-efc8-11eb-8a9b-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "65227d22-efc8-11eb-b78e-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "6af2a0cf-efc5-11eb-806d-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "6af2b69b-efc5-11eb-8d5a-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "6af2b6a0-efc5-11eb-985a-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "d9368892-1902-11ef-aa9c-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "87d3c2a4-f44f-11eb-a170-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "87d3d7b6-f44f-11eb-a60d-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "87d3d7bc-f44f-11eb-b884-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "87d3d7b7-f44f-11eb-acd2-a87eeabdefba": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "96656e9c-d646-11ee-8b04-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "96826227-0262-11eb-a1c0-f875a44e0e11": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "e2815e0c-37bd-11ef-a167-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "d9bd0b80-d643-11ee-8b04-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "e8d511cc-d64c-11ee-8b04-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "eeec9e68-d23c-11ee-9373-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "82731030-37bf-11ef-a167-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "5253a3a8-37bd-11ef-a167-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "85396d94-37bc-11ef-9263-0242ac150006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
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
