define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'js-cookie',
  'viewmodels/alert',
  'arches',
  'uuid',
  'viewmodels/workflow'
], function ($, _, ko, koMapping, Cookies, AlertViewModel, arches, uuid, WorkflowViewModel) {
  const OpenWorkflow = function (config) {
    WorkflowViewModel.apply(this, [config]);

    this.WORKFLOW_OPEN_MODE_LABEL = 'workflow-open-mode';
    this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';

    (() => {
      /**
       * Only run in open mode.
       */
      this.getWorkflowHistoryData = async function (key) {
        const openMode = JSON.parse(localStorage.getItem(this.WORKFLOW_OPEN_MODE_LABEL));
        localStorage.removeItem(this.WORKFLOW_OPEN_MODE_LABEL);

        const rawConfigData = localStorage.getItem(this.OPEN_WORKFLOW_CONFIG);
        let configData = {};
        if (rawConfigData) {
          configData = JSON.parse(rawConfigData);
          localStorage.removeItem(this.OPEN_WORKFLOW_CONFIG);
        }

        if (openMode) {
          const workflowId = this.id();
          const searchParams = new URLSearchParams(window.location.search);
          const resourceId = searchParams.get('resource-id');
          const response = await $.ajax({
            type: 'POST',
            url: '/open-workflow',
            dataType: 'json',
            data: JSON.stringify({
              stepConfig: this.stepConfig,
              resourceId: resourceId,
              workflowId: workflowId,
              workflowSlug: this.componentName,
              openConfig: configData
            }),
            context: this,
            error: (response, status, error) => {
              console.log(response, status, error);
            }
          });
          if (response?.stepdata) {
            return response;
          } else {
            this.alert(
              new AlertViewModel(
                'ep-alert-red',
                response.statusText,
                response.responseText,
                null,
                function () {}
              )
            );
          }
        } else {
          const workflowid = this.id();
          const response = await fetch(arches.urls.workflow_history + workflowid, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-CSRFToken': Cookies.get('csrftoken')
            }
          });
          if (response.ok) {
            const data = await response.json();
            return data;
          } else {
            this.alert(
              new AlertViewModel(
                'ep-alert-red',
                response.statusText,
                response.responseText,
                null,
                function () {}
              )
            );
          }
        }
      };
    })();
  };

  return OpenWorkflow;
});
