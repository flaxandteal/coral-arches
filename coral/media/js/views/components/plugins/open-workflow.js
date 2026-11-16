import $ from 'jquery';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import arches from 'arches';
import OpenWorkflow from 'viewmodels/open-workflow';
import pageTemplate from 'templates/views/components/plugins/open-workflow.htm';

const openWorkflowViewModel = function (params) {
  OpenWorkflow.apply(this, [params]);
};

export default ko.components.register('open-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
