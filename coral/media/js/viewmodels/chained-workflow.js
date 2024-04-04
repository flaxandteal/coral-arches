define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'js-cookie',
  'viewmodels/alert',
  'arches',
  'uuid',
  'viewmodels/openable-workflow'
], function ($, _, ko, koMapping, Cookies, AlertViewModel, arches, uuid, OpenWorkflowViewModel) {
  const ChainedWorkflow = function (config) {
    OpenWorkflowViewModel.apply(this, [config]);

    this.chainPan = ko.observable();

    this.updateChainPan = function(val){
      if (this.chainPan() !== val) {
          this.chainPan(val);
      } else {
          this.chainPan.valueHasMutated();
      }
  };
  };

  return ChainedWorkflow;
});
