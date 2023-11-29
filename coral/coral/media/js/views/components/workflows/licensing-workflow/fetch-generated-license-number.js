define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/fetch-generated-license-number.htm',
  'viewmodels/alert'
], function (_, ko, koMapping, uuid, arches, componentTemplate, AlertViewModel) {
  function viewModel(params) {
    this.STATUS_NODE = 'fb18edd0-48b8-11ee-84da-0242ac140007';
    this.STATUS_FINAL_VALUE = '8c454982-c470-437d-a9c6-87460b07b3d9';
    this.EXTERNAL_REF_NUMBER_NODE = '280b75bc-4e4d-11ee-a340-0242ac140007';
    this.EXTERNAL_REF_SOURCE_NODE = '280b7a9e-4e4d-11ee-a340-0242ac140007';
    this.EXTERNAL_REF_EXCAVATION_VALUE = '9a383c95-b795-4d76-957a-39f84bcee49e';

    this.STEPS_LABEL = 'workflow-steps';
    this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL = 'workflow-component-abstracts';

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
      const tiles = await this.fetchTileData(this.resourceId(), this.EXTERNAL_REF_NUMBER_NODE);

      if (tiles.length > 1) {
        for (const tile of tiles) {
          if (tile.data[this.EXTERNAL_REF_SOURCE_NODE] === this.EXTERNAL_REF_EXCAVATION_VALUE) {
            return tile;
          }
        }
      }

      if (tiles.length === 1) {
        return tiles[0];
      }
    };

    this.storeLicenseNumberTile = (tile) => {
      const worflowSteps = JSON.parse(localStorage.getItem(this.STEPS_LABEL));
      const licenseNoStepId = JSON.parse(worflowSteps['app-details-step'].componentIdLookup)[
        'license-no'
      ];

      const workflowComponentAbstracts = JSON.parse(
        localStorage.getItem(this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL)
      );
      workflowComponentAbstracts[licenseNoStepId] = {
        value: JSON.stringify({
          tileData: koMapping.toJSON(tile.data),
          resourceInstanceId: tile.resourceinstance,
          tileId: tile.tileid,
          nodegroupId: tile.nodegroup
        })
      };

      localStorage.setItem(
        this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL,
        JSON.stringify(workflowComponentAbstracts)
      );
    };

    this.processLicenseNumberTile = async () => {
      if (self.tile().data[this.STATUS_NODE]() !== this.STATUS_FINAL_VALUE) {
        params.form.complete(true);
        params.form.saving(false);
        return;
      }

      const licenseNumberTile = await this.fetchLicenseNumberTile();
      if (!licenseNumberTile) return;

      this.storeLicenseNumberTile(licenseNumberTile);

      let licenseNumber =
        licenseNumberTile.data[this.EXTERNAL_REF_NUMBER_NODE][arches.activeLanguage].value;

      params.pageVm.alert(
        new AlertViewModel(
          'ep-alert-blue',
          `Application status is "Final". License Number: ${licenseNumber}. Click "Ok" to continue.`,
          `This application's status has been moved to "Final". With that a license number has been genereated that will now be used to identify this application. Example 'Excavation License ${licenseNumber}', please use this to find the file in the future. The old application ID will still work when on the search page.`,
          null,
          () => {
            params.form.complete(true);
            params.form.saving(false);
            /**
             * Hacky... but shouldn't be noticable to user and will show the latest data
             * stored in local storage. Allowing the user to go back a page and see
             * the license number.
             */
            setTimeout(() => {
              location.reload();
            });
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
