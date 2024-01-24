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

    (() => {
      /**
       * Only run in open mode.
       */
      // const openMode = JSON.parse(localStorage.getItem(this.WORKFLOW_OPEN_MODE_LABEL));
      // if (!openMode) return;
      // localStorage.removeItem(this.WORKFLOW_OPEN_MODE_LABEL);
      this.getWorkflowHistoryData = async function (key) {
        console.log('arches.urls.open_workflow: ', arches.urls.open_workflow);
        const openMode = JSON.parse(localStorage.getItem(this.WORKFLOW_OPEN_MODE_LABEL));
        localStorage.removeItem(this.WORKFLOW_OPEN_MODE_LABEL);

        if (openMode) {
          const searchParams = new URLSearchParams(window.location.search);
          const resourceId = searchParams.get('resource-id');
          const workflowid = this.id();
          const response = await fetch(`/open-workflow?resource-id=${resourceId}&workflow-id=${workflowid}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-CSRFToken': Cookies.get('csrftoken')
            }
          });
          if (response.ok) {
            const data = await response.json();
            console.log('response ok: ', data);
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
        } else {
          const workflowid = this.id();
          console.log('I* workflowid: ', workflowid)
          const response = await fetch(arches.urls.workflow_history + workflowid, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-CSRFToken': Cookies.get('csrftoken')
            }
          });
          if (response.ok) {
            const data = await response.json();
            console.log('path 2: ', data)
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
