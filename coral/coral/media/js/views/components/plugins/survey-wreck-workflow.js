define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/assign-consultation-workflow.htm'
  ], function (ko, arches, Workflow, wreckReportSurveyTemplate) {
    return ko.components.register('wreck-survey', {
      viewModel: function (params) {
        this.componentName = 'wreck-survey';
        (this.stepConfig = [
          {
            title: 'Wreck (HRDB)',
            name: 'hrdb-wreck',
            class: 'show-only-details',
            required: true,
            informationboxdata: {
              heading: 'wreck (HRDB)',
              text: 'Select the cm ref for this record'
            },
            layoutSections: [
              {
                componentConfigs: [
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'system-ref' /* unique to step */,
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: 'f1cbd893-f007-11eb-b7b8-a87eeabdefba'
                    }
                  }
                ]
              }
            ]
          },
          {
            title: 'Wreck (HRDB)',
            name: 'hrdb-wreck-details',
            class: 'show-only-details',
            workflowstepclass: 'workflow-form-component',
            required: true,
            informationboxdata: {
              heading: 'Wreck (HRDB)',
              text: 'Select the cm ref for this record'
            },
            layoutSections: [
              {
                componentConfigs: [
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'cargo' /* unique to step */,
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: '8b1aa8b1-59df-11e9-b16b-18cf5eb368c4',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'nationalities' /* unique to step */,
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: 'fddccd41-59f0-11e9-bdac-18cf5eb368c4',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'survey-condition-notes-summary' /* unique to step */,
                    tilesManaged: 'many',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: 'ed3c32e3-29a1-11eb-a399-f875a44e0e11',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'designation-and-protection' /* unique to step */,
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: '94fa17fb-f008-11eb-a12d-a87eeabdefba',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'asset-dimensions' /* unique to step */,
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: 'a6bbf31b-299e-11eb-bb46-f875a44e0e11',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  // {
                  //     componentName: 'voyages',
                  //     uniqueInstanceName: 'asset-dimensions', /* unique to step */
                  //     tilesManaged: 'one',
                  //     parameters: {
                  //         graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                  //         nodegroupid: '8b1aa8b1-59df-11e9-b16b-18cf5eb368c4',
                  //         resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']",
                  //     },
                  // },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'external-refs' /* unique to step */,
                    tilesManaged: 'many',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: '1ad3fb19-f008-11eb-812d-a87eeabdefba',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'craft-type' /* unique to step */,
                    tilesManaged: 'many',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: '656c41a9-3ec0-11eb-a444-f875a44e0e11',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'craft-name' /* unique to step */,
                    tilesManaged: 'many',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: 'd00d4c87-299f-11eb-b05e-f875a44e0e11',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'craft-owner' /* unique to step */,
                    tilesManaged: 'many',
                    parameters: {
                      graphid: '49bac32e-5464-11e9-a6e2-000d3ab1e588',
                      nodegroupid: 'b0868864-501c-11eb-9953-f875a44e0e11',
                      resourceid: "['hrdb-wreck']['system-ref'][0]['resourceInstanceId']"
                    }
                  }
                ]
              }
            ]
          }
        ]),
          Workflow.apply(this, [params]);
        this.quitUrl = arches.urls.plugin('init-workflow');
      },
      template: wreckReportSurveyTemplate
    });
  });