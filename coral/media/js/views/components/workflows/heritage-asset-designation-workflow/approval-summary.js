define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/heritage-asset-designation-workflow/ha-summary.htm'
], function (ko, SummaryStep, template) {
  function viewModel(params) {
    SummaryStep.apply(this, [params]);

    this.heritageAssetNodes = {
      id: 'heritage-asset',
      label: 'Approvals Step',
      systemRef: {
        label: 'Summary',
        nodegroupId: '3c51740c-dbd0-11ee-8835-0242ac120006',
        renderNodeIds: [
          {
            nodeId: '3b267ffe-dbd1-11ee-b0db-0242ac120006',
            label: 'Assessment Done By',
            defaultValue: 'Not provided'
          },
          {
            nodeId: 'ad22dad6-dbd0-11ee-b0db-0242ac120006',
            label: 'Approved By',
            defaultValue: 'Not provided'
          },
          {
            nodeId: 'd70da550-3798-11ef-a167-0242ac150006',
            label: 'Statutory Consultee Notification Date',
            defaultValue: 'Not provided'
          },
          {
            nodeId: '59935456-379a-11ef-9263-0242ac150006',
            label: 'Director Sign Off Date',
            defaultValue: 'Not provided'
          },
          {
            nodeId: 'a20d4124-3795-11ef-9263-0242ac150006',
            label: 'Owner Notified Date',
            defaultValue: 'Not provided'
          },
          {
            nodeId: '0cd0998c-dbd6-11ee-b0db-0242ac120006',
            label: 'Approved Date',
            defaultValue: 'Not provided'
          },
          {
            nodeId: 'cffa2fc8-3797-11ef-a167-0242ac150006',
            label: 'Local Authority Notification Date',
            defaultValue: 'Not provided'
          },
          {
            nodeId: 'af5fd406-dbd1-11ee-b0db-0242ac120006',
            label: 'Assessment Date',
            defaultValue: 'Not provided'
          }
        ]
      }
    };

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.heritageAssetNodes);
    };

    this.loadData();
  }

  ko.components.register('approval-summary', {
    viewModel: viewModel,
    template: template
  });
  return viewModel;
});
