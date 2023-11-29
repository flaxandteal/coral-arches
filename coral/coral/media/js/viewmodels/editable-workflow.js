define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'uuid',
  'viewmodels/workflow'
], function ($, _, ko, koMapping, arches, uuid, WorkflowViewModel) {
  const EditableWorkflow = function (config) {
    WorkflowViewModel.apply(this, [config]);

    /**
     * These aren't exposed on the base WorkflowViewModel.
     */
    this.WORKFLOW_LABEL = 'workflow';
    this.WORKFLOW_ID_LABEL = 'workflow-id';
    this.STEPS_LABEL = 'workflow-steps';
    this.STEP_ID_LABEL = 'workflow-step-id';
    this.STEP_IDS_LABEL = 'workflow-step-ids';
    this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL = 'workflow-component-abstracts';
    this.WORKFLOW_EDIT_MODE_LABEL = 'workflow-edit-mode';

    /**
     * The square-bracket/array-access notation used might not be setup or needed
     * in some cases. For example the ones defined below will always be setup and configured
     * but if your workflow is using custom values that get registered when saving. You need
     * to either configure them from the workflow resource setup function and add them to the
     * safe list or don't provide them at all and allow them to be removed.
     */
    this.safeArrayAccesses;
    this.defaultArrayAccesses = ['resourceInstanceId', 'tileId'];

    (() => {
      /**
       * Only run in edit mode.
       */
      const editMode = JSON.parse(localStorage.getItem(this.WORKFLOW_EDIT_MODE_LABEL));
      if (!editMode) return;
      localStorage.removeItem(this.WORKFLOW_EDIT_MODE_LABEL);

      /**
       * Set array accesses;
       */
      if (!this.safeArrayAccesses) {
        this.safeArrayAccesses = this.defaultArrayAccesses;
      }

      /**
       * The current system will try match the UUID kept in the address bar
       * to check for data in local storage. This is used when the user refreshes
       * while in the workflow. This will generate and configure a UUID so that when
       * the comparision between the URL UUID and local storage UUID takes place they
       * match preventing the local storage data from being cleared.
       */
      const id = uuid.generate();
      this.setToLocalStorage(this.WORKFLOW_ID_LABEL, id);
      this.id = ko.observable(id);
      this.setWorkflowIdToUrl();

      /**
       * Issues with cardinality...
       * TODO: Explain
       */
      const seenIds = {};
      this.stepConfig.forEach((step) => {
        step.layoutSections[0].componentConfigs.forEach((component) => {
          const nodegroupId = component?.parameters?.nodegroupid;
          if (!nodegroupId) return;
          if (!(nodegroupId in seenIds)) {
            seenIds[nodegroupId] = {
              nodegroupId,
              stepName: step.name,
              uniqueNames: [component.uniqueInstanceName],
              totalNames: [component.uniqueInstanceName],
              totalUnique: 1
            };
          } else {
            if (!seenIds[nodegroupId].uniqueNames.includes(component.uniqueInstanceName)) {
              seenIds[nodegroupId].uniqueNames.push(component.uniqueInstanceName);
            }
            seenIds[nodegroupId].totalNames.push(component.uniqueInstanceName);
            seenIds[nodegroupId].totalUnique = seenIds[nodegroupId].uniqueNames.length;
          }
        });
      });

      /**
       * Rewritting the randomly generated UUIDs with their nodegroups and if there
       * is multiple tiles with the same nodegroup, add a suffix with the
       * uniqueIntanceName to the end.
       *
       * When running the setup function tiles can be matched to the components with
       * the same nodegroups automatically. If the nodegroup has been used more than
       * once use the uniqueInstanceName to populate them correctly.
       */
      const result = {};
      this.stepConfig.forEach((step) => {
        const components = {};
        step.layoutSections[0].componentConfigs.forEach((component) => {
          const nodegroupId = component?.parameters?.nodegroupid;
          if (!nodegroupId) return;
          if (seenIds[nodegroupId].totalUnique > 1) {
            components[component.uniqueInstanceName] =
              nodegroupId + `|${component.uniqueInstanceName}`;
          } else {
            components[component.uniqueInstanceName] = nodegroupId;
          }
        });
        if (Object.values(components).length) {
          result[step.name] = {
            componentIdLookup: JSON.stringify(components)
          };
        }
      });

      /**
       * Find and clear all components with unsafe array accesses.
       */
      this.stepConfig = this.stepConfig.map((stepConfig) => {
        stepConfig.layoutSections = stepConfig.layoutSections.map((layoutSection) => {
          layoutSection.componentConfigs = layoutSection.componentConfigs.map((config) => {
            Object.entries(config.parameters).forEach(([key, value]) => {
              if (
                (typeof value === 'string' || value instanceof String) &&
                value.includes('[') &&
                value.includes(']')
              ) {
                const isSafe = this.safeArrayAccesses.some((keyIdx) => value.includes(keyIdx));
                if (!isSafe) {
                  delete config.parameters[key];
                }
              }
            });
            return config;
          });
          return layoutSection;
        });
        return stepConfig;
      });

      /**
       * Save the rewritten component ID lookups to local storage.
       */
      localStorage.setItem(this.STEPS_LABEL, JSON.stringify(result));
    })();
  };

  return EditableWorkflow;
});
