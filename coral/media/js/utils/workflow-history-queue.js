import arches from 'arches';
import Cookies from 'js-cookie';

/*
    Workflow history is patched from two places — workflow-step.js posts stepdata
    whenever its componentIdLookup changes (once per component registering, so a
    dozen times as a step builds), and workflow-component-abstract.js posts
    componentdata per component on save. Every one of those hits the same
    WorkflowHistory row, and the server takes select_for_update on it, so they
    serialise: N posts cost N lock acquisitions while the rest of the step's
    requests queue behind them.

    The server merges both fields with a JSONB `||`, so merging patches here and
    sending one post is equivalent to sending them separately.

    Flush is a zero timeout, not a debounce window: everything queued in the same
    tick coalesces, while a caller that awaits one post before issuing the next
    still goes straight out instead of paying a delay every time.
*/

var pending = {};
var pendingFlush = {};

/**
 * Queue a workflow-history patch, merging it with any patch already waiting.
 *
 * @param {string} workflowid
 * @param {string} workflowname
 * @param {object} patch - {stepdata: {...}} and/or {componentdata: {...}}
 * @returns {Promise} resolves when the batch this patch joined has been posted
 */
export default function queueWorkflowHistory(workflowid, workflowname, patch) {
    if (!(workflowid in pending)) {
        pending[workflowid] = { workflowname: workflowname, stepdata: {}, componentdata: {} };
        pendingFlush[workflowid] = new Promise(function(resolve, reject) {
            setTimeout(function() {
                var batch = pending[workflowid];
                delete pending[workflowid];
                delete pendingFlush[workflowid];
                fetch(arches.urls.workflow_history + workflowid, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        "X-CSRFToken": Cookies.get('csrftoken')
                    },
                    body: JSON.stringify({
                        workflowid: workflowid,
                        workflowname: batch.workflowname,
                        completed: false,
                        stepdata: batch.stepdata,
                        componentdata: batch.componentdata,
                    }),
                }).then(resolve, reject);
            }, 0);
        });
    }

    var batch = pending[workflowid];
    ['stepdata', 'componentdata'].forEach(function(field) {
        var incoming = patch[field];
        if (!incoming) { return; }
        Object.keys(incoming).forEach(function(key) {
            /* Later patches win per key, matching what the server's || merge
               would have done had these gone out as separate posts. */
            batch[field][key] = Object.assign({}, batch[field][key], incoming[key]);
        });
    });

    return pendingFlush[workflowid];
}
