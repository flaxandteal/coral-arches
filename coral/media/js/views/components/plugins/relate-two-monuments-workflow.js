import ko from 'knockout';
import arches from 'arches';
import OpenableWorkflow from 'viewmodels/openable-workflow';
import workflowTemplate from 'templates/views/components/plugins/default-workflow.htm';
import selectResourceId from 'views/components/workflows/select-resource-id';
import defaultCardUtil from 'views/components/workflows/default-card-util';

export default ko.components.register('relate-two-monuments-workflow', {
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
            text: 'The monument selected here will be the Heritage Asset that it is related to. The Heritage Asset selected on the second page will appear on this Heritage Asset.'
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
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']",
                    nodeOptions: {
                      '055b3e44-04c7-11eb-b131-f875a44e0e11': {
                        allowInstanceCreation: false
                      }
                    }
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
                    nodegroupid: '450ee1c9-8f79-59b6-a064-01bcb6ddbc2a',
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']",
                    parenttileid: "['relating-step']['relating-record'][0]['tileId']",
                    nodeOptions: {
                      "f58ee75a-c03d-573e-9c8a-31485ad7db75": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "a1aa083d-ecdf-55b4-bf07-7a309e8805ab": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "3873bf2c-fefd-5690-a9aa-66b8b7527900": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "efe1d7fb-390c-5ffd-b355-2aa49faf686a": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ac9f7da3-6114-5f60-bf8b-ad2f48e169ae": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "576a84d3-b527-5f63-b612-9b211b3c2a45": {
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
                      "541ca8f3-cd26-54c0-8b2e-e61f928f8407": {
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
                      "edc70a09-4e17-5c26-a5d8-e56fc4cbffcf": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "96826227-0262-11eb-a1c0-f875a44e0e11": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "19b28607-0503-585e-9958-a566a431ec95": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "e6189d50-775d-5fb8-85d5-aaa81c295228": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "853520ed-15ec-5f13-b265-ecf8253cb5c9": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "126b8c3c-d980-5ebc-8719-a8a8376577f6": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1d0cf09e-d91e-5f02-8a87-35fe31cec675": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "eacf7968-bd81-522d-96e9-9474fe27e449": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "8836a65e-92cb-5330-b468-c6adbe6cc7a5": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    },
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'associated-by',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '3567a048-599c-5d3e-b9da-332140612855',
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']",
                    parenttileid: "['relating-step']['relating-record'][0]['tileId']",
                    nodeOptions: {
                      "0dac88be-9e0d-5612-b9ad-6b8cface6588": {
                        "component": "user-to-model-select",
                        "signOffGroups": [
                          "1ce90bd5-4063-4984-931a-cc971414d7db",
                          "7e044ca4-96cd-4550-8f0c-a2c860f99f6b",
                          "7679f42b-56ad-4b18-8b2c-cc6de1b16537",
                          "e778f4a1-97c6-446f-b1c4-418a81c3212e"
                        ],
                        "allowInstanceCreation": false
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
