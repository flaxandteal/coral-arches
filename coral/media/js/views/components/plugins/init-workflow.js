define([
  'knockout',
  'arches',
  'templates/views/components/plugins/init-workflow.htm'
], function(ko, arches, initWorkflowTemplate) {

  var InitWorkflow = function(params) {
      const allowedWorkflows = ko.observableArray([]);
      this.workflows = allowedWorkflows;
      $.ajax({
          dataType: "json",
          //url: url,
          url: arches.urls.api_plugins,
          data: {},
          success: function(data) {
              console.log(data, "plugins");
              const allowedPlugins = data.map(plugin => plugin.slug);
              const workflows = params.workflows.filter(function(wf) {
                  const slugParts = wf.slug.split("=");
                  return allowedPlugins.includes(slugParts.pop());
              }).map(function(wf){
                  wf.url = arches.urls.plugin(wf.slug);
                  return wf;
              }, this);
              allowedWorkflows(workflows);
          },
          error: function(err) {
              console.log(err, 'unable to fetch users');
          }
      });
  };

  return ko.components.register('init-workflow', {
      viewModel: InitWorkflow,
      template: initWorkflowTemplate
  });
});
