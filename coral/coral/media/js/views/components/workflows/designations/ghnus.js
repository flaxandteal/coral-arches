define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/application-area.htm'
], function (ko, arches, Workflow, applicationAreaTemplate) {
  return ko.components.register('ghnus-designation', {
    viewModel: function (params) {
      this.componentName = 'ghnus-designation';
      this.stepConfig = [
        {
          title: 'GHNUS',
          name: 'ghnus-instance',
          required: true,
          informationboxdata: {
            heading: 'GHNUS',
            text: 'Provide a name for this GHNUS'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'ghnus-site-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '78b32d8c-b6f2-11ea-af42-f875a44e0e11',
                    nodegroupid: '972d3864-b6f2-11ea-9a38-f875a44e0e11',
                    renderContext: 'workflow'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'GHNUS Description',
          name: 'ghnus-description',
          required: false,
          informationboxdata: {
            heading: 'GHNUS Description',
            text: ''
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'description' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '78b32d8c-b6f2-11ea-af42-f875a44e0e11',
                    nodegroupid: '4f8b9fcc-b6f3-11ea-bdcf-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid: "['ghnus-instance']['ghnus-site-name'][0]['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'GHNUS Location Data',
          name: 'location-data',
          workflowstepclass: 'workflow-form-component',
          required: true,
          informationboxdata: {
            heading: 'Heritage Designation',
            text: 'Detail the selected category for this site'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'ghnus-map' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '78b32d8c-b6f2-11ea-af42-f875a44e0e11',
                    nodegroupid: 'cb6ca579-4f66-11eb-9200-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid: "['ghnus-instance']['ghnus-site-name'][0]['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'location-type' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '78b32d8c-b6f2-11ea-af42-f875a44e0e11',
                    nodegroupid: '9420c96e-bd40-11eb-9a96-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid: "['ghnus-instance']['ghnus-site-name'][0]['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'location-refs' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '78b32d8c-b6f2-11ea-af42-f875a44e0e11',
                    nodegroupid: '9d8fb4ad-eff6-11eb-8c13-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid: "['ghnus-instance']['ghnus-site-name'][0]['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: applicationAreaTemplate
  });
});
