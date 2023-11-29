define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'viewmodels/workflow-step',
  'views/components/workflows/licensing-workflow/select-resource-step',
  'views/components/workflows/photo-gallery-step'
], function (ko, arches, Workflow, workflowTemplate) {
  return ko.components.register('excavation-site-visit-workflow', {
    viewModel: function (params) {
      this.componentName = 'excavation-site-visit-workflow';

      this.stepConfig = [
        {
          title: 'Site Visit Details',
          name: 'excavation-site-init',
          required: true,
          informationboxdata: {
            heading: 'Site Visit Details',
            text: 'Select the Licence for the visit'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'excavation-select-resource-step',
                  uniqueInstanceName: 'visit',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd', //license graph
                    nodegroupid: 'f1e707c6-61ed-11ee-baf1-0242ac120004', //Visit Date & desc
                    graphids: ['cc5da227-24e7-4088-bb83-a564c4331efd']
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Edit or Add Archive Storage Location',
          name: 'excavation-site-archive-details',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Archive Storage Location',
            text: 'Check the details of the storage location'
          },
          layoutSections: [
            {
              componentConfigs: [
                // {
                //     componentName: 'default-card-util',
                //     uniqueInstanceName: 'excavation-artifact',
                //     tilesManaged: 'one',
                //     visible: false,
                //     parameters: {
                //         graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588', //license graph
                //         nodegroupid: 'b9e07043-5463-11e9-bb70-000d3ab1e588',
                //         visible: false,
                //         resourceid: "['excavation-site-init']['visit']['resourceid']['activityResourceId']",
                //         // tileid: "['excavation-site-init']['visit']['resourceid']['activityTileId']",
                //         labels: [['Associated Monument, Area or Artefact', 'Associated Artefact']]

                //     },
                // },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'excavation-archive',
                  tilesManaged: 'one',
                  visible: false,
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588', //license graph
                    nodegroupid: '5f00ef7e-9f63-11ea-9db8-f875a44e0e11',
                    visible: false,
                    resourceid:
                      "['excavation-site-init']['visit']['resourceid']['activityResourceId']",
                    tileid: "['excavation-site-init']['visit']['resourceid']['activityTileId']"
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
    template: workflowTemplate
  });
});
