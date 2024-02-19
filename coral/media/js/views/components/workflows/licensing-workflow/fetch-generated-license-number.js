define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/fetch-generated-license-number.htm',
  'viewmodels/alert',
  'js-cookie'
], function (_, ko, koMapping, uuid, arches, componentTemplate, AlertViewModel, Cookies) {
  function viewModel(params) {
    this.LICENSE_NUMBER_NODE = '9a9e198c-c502-11ee-af34-0242ac180006';

    this.STATUS_NODEGROUP = '4f0f655c-48cf-11ee-8e4e-0242ac140007';
    this.STATUS_NODE = 'a79fedae-bad5-11ee-900d-0242ac180006';
    this.STATUS_FINAL_VALUE = '8c454982-c470-437d-a9c6-87460b07b3d9';

    this.CUR_D_DECISION_NODEGROUP = 'c9f504b4-c42d-11ee-94bf-0242ac180006';
    this.CUR_D_DECISION_NODE = '2a5151f0-c42e-11ee-94bf-0242ac180006';
    this.CUR_D_DECISION_APPROVED_VALUE = '0c888ace-b068-470a-91cb-9e5f57c660b4';

    const self = this;

    _.extend(this, params.form);
    self.tile()?.dirty.subscribe(function (val) {
      self.dirty(val);
    });

    this.fetchTileData = async (resourceId, nodeId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.fetchLicenseNumberTile = async () => {
      const tiles = await this.fetchTileData(this.resourceId(), this.LICENSE_NUMBER_NODE);

      if (tiles.length === 1) {
        return tiles[0];
      }
    };

    this.fetchStatusTile = async () => {
      const tiles = await this.fetchTileData(this.resourceId(), this.STATUS_NODE);

      if (tiles.length === 1) {
        return tiles[0];
      }
    };

    this.fetchDecisionTile = async () => {
      const tiles = await this.fetchTileData(this.resourceId(), this.CUR_D_DECISION_NODE);

      if (tiles.length === 1) {
        return tiles[0];
      }
    };

    this.getWorkflowHistoryData = async function (workflowid) {
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
        self.alert(
          new AlertViewModel(
            'ep-alert-red',
            response.statusText,
            response.responseText,
            null,
            function () {}
          )
        );
      }
    };

    this.setToWorkflowHistory = async function (componentId, workflowId, key, value) {
      const workflowHistory = {
        workflowid: workflowId,
        completed: false,
        componentdata: {
          [componentId]: {
            [key]: value
          }
        }
      };
      await fetch(arches.urls.workflow_history + workflowId, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': Cookies.get('csrftoken')
        },
        body: JSON.stringify(workflowHistory)
      });
    };

    this.storeLicenseNumberTile = async (tile) => {
      const searchParams = new URLSearchParams(window.location.search);
      const workflowId = searchParams.get('workflow-id');

      const history = await this.getWorkflowHistoryData(workflowId);

      const componentId =
        history.stepdata['record-decision-step']['componentIdLookup']['license-number'];

      await this.setToWorkflowHistory(componentId, workflowId, 'value', {
        tileData: JSON.stringify(tile.data),
        resourceInstanceId: tile.resourceinstance,
        tileId: tile.tileid,
        nodegroupId: tile.nodegroup
      });
    };

    this.processLicenseNumberTile = async () => {
      let tile = null;
      switch (self.tile().nodegroup_id) {
        case this.STATUS_NODEGROUP:
          if (self.tile().data[this.STATUS_NODE]() !== this.STATUS_FINAL_VALUE) {
            params.form.complete(true);
            params.form.saving(false);
            return;
          }
          tile = await this.fetchDecisionTile();
          if (!tile || tile.data[this.CUR_D_DECISION_NODE] !== this.CUR_D_DECISION_APPROVED_VALUE) {
            params.form.complete(true);
            params.form.saving(false);
            return;
          }
          break;
        case this.CUR_D_DECISION_NODEGROUP:
          if (self.tile().data[this.CUR_D_DECISION_NODE]() !== this.CUR_D_DECISION_APPROVED_VALUE) {
            params.form.complete(true);
            params.form.saving(false);
            return;
          }
          tile = await this.fetchStatusTile();
          if (!tile || tile.data[this.STATUS_NODE] !== this.STATUS_FINAL_VALUE) {
            params.form.complete(true);
            params.form.saving(false);
            return;
          }
          break;
      }

      const licenseNumberTile = await this.fetchLicenseNumberTile();
      if (!licenseNumberTile) {
        params.form.complete(true);
        params.form.saving(false);
        return;
      }
      await this.storeLicenseNumberTile(licenseNumberTile);
      const licenseNumber =
        licenseNumberTile.data[this.LICENSE_NUMBER_NODE][arches.activeLanguage].value;

      params.pageVm.alert(
        new AlertViewModel(
          'ep-alert-blue',
          `Application status is "Final". License Number: ${licenseNumber}. Click "Ok" to continue.`,
          `This application's status has been moved to "Final". With that a license number has been genereated that will now be used to identify this application. Example 'Excavation License ${licenseNumber}', please use this to find the file in the future. The old application ID will still work on the search page.`,
          null,
          () => {
            params.form.complete(true);
            params.form.saving(false);
          }
        )
      );
    };

    params.form.save = async () => {
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        nodegroupId: self.tile().nodegroup_id
      });
      await this.processLicenseNumberTile();
    };
  }

  ko.components.register('fetch-generated-license-number', {
    viewModel: viewModel,
    template: componentTemplate
  });

  return viewModel;
});
