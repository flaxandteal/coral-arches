import $ from 'jquery';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import arches from 'arches';
import OpenWorkflow from 'viewmodels/open-workflow';
import pageTemplate from 'templates/views/components/plugins/open-issue-report-workflow.htm';

// 'Issue Report' nodegroup on the Heritage Asset graph -- see
// coral/management/commands/seed_test_issue_report.py.
const ISSUE_REPORT_NODEGROUP_ID = '7f835acf-5601-5dae-ac0f-6f030fc50ee7';

const openWorkflowViewModel = function (params) {
  OpenWorkflow.apply(this, [params]);

  this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';

  // Start New must not send a report picked earlier in the dropdown: the
  // server treats a present parentTileIds entry as "open this tile", flag
  // or no flag.
  const baseOpenWorkflow = this.openWorkflow;
  this.openWorkflow = async (startNew) => {
    if (startNew) {
      this.addtionalConfigData()['parentTileIds'][ISSUE_REPORT_NODEGROUP_ID] = null;
      this.setAdditionalOpenConfigData();
    }
    await baseOpenWorkflow(startNew);
  };

  this.issueTiles = ko.observableArray();
  this.selectedIssueReport = ko.observable();

  this.configKeys = ko.observable({ placeholder: 0 });

  this.addtionalConfigData = ko.observable({
    parentTileIds: {}
  });

  this.parentTileOptions = ko.observableArray();

  this.fetchTileData = async (resourceId, nodeId) => {
    const tilesResponse = await window.fetch(
      arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
        (nodeId ? `?nodeid=${nodeId}` : '')
    );
    const data = await tilesResponse.json();
    return data.tiles;
  };

  // 'Issue Reference Number' node, on the 'Issue Reference' nodegroup of the
  // Heritage Asset graph -- see ISSUE_REFERENCE_NUMBER_NODE in
  // coral/management/commands/seed_test_issue_report.py. The label comes from
  // this child tile, but the option's id is the child's PARENT tile (the
  // 'Issue Report' tile), which is what the workflow actually opens.
  this.getParentTileOptions = async (resourceId) => {
    const tiles = await this.fetchTileData(resourceId, 'b075893b-848d-5520-9d52-3c3dfbecde16');
    this.parentTileOptions(
      tiles.map((tile, idx) => {
        return {
          text: tile?.data['b075893b-848d-5520-9d52-3c3dfbecde16']?.en?.value,
          tile: tile,
          id: tile.parenttile
        };
      })
    );
  };

  this.setAdditionalOpenConfigData = () => {
    localStorage.setItem(this.OPEN_WORKFLOW_CONFIG, JSON.stringify(this.addtionalConfigData()));
  };

  this.selectedResource.subscribe(async (resourceId) => {
    if (!resourceId) {
      this.parentTileOptions([]);
      this.selectedIssueReport(null);
      return;
    }
    this.getParentTileOptions(resourceId);
  });

  this.selectedIssueReport.subscribe((tileId) => {
    this.addtionalConfigData()['parentTileIds'][ISSUE_REPORT_NODEGROUP_ID] = tileId;
    this.setAdditionalOpenConfigData();
  });
};

export default ko.components.register('open-issue-report-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
