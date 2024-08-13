define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/excavation-site-visit-workflow/get-selected-license-details.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.SELECTED_LICENSE_NODEGROUP_AND_NODE = '879fc326-02f6-11ef-927a-0242ac150006';

    this.ASSOCIATED_ACITITY_NODEGROUP_AND_NODE = 'a9f53f00-48b6-11ee-85af-0242ac140007';

    this.CM_REFERENCE_NODEGROUP = 'b84fa9c6-bad2-11ee-b3f2-0242ac180006';
    this.CM_REFERENCE_NODE = 'b84fb182-bad2-11ee-b3f2-0242ac180006';

    this.ACTIVITY_NAME_NODEGROUP = '4a7bba1d-9938-11ea-86aa-f875a44e0e11';
    this.ACTIVITY_NAME_NODE = '4a7be135-9938-11ea-b0e2-f875a44e0e11';

    this.CONTACTS_NODEGROUP = '6d290832-5891-11ee-a624-0242ac120004';
    this.LICENSEE_NODE = '6d294784-5891-11ee-a624-0242ac120004';

    this.labels = params.labels || [];

    this.selectedResource = ko.observable();

    this.cmNumber = ko.observable();
    this.siteName = ko.observable();
    this.licensee = ko.observable();

    this.form
      .card()
      ?.widgets()
      .forEach((widget) => {
        this.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });

    this.tile.data[this.SELECTED_LICENSE_NODEGROUP_AND_NODE].subscribe((value) => {
      if (value && value.length) {
        const resourceId = ko.unwrap(value[0].resourceId);
        this.selectedResource(resourceId);
        this.getDetails(resourceId);
      }
    }, this);

    this.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.getDetails = async (resourceId) => {
      const tiles = await this.fetchTileData(resourceId);

      for (const tile of tiles) {
        if (tile.nodegroup === this.CM_REFERENCE_NODEGROUP) {
          this.cmNumber(tile.data[this.CM_REFERENCE_NODE]?.en?.value || 'N/A');
        }

        if (tile.nodegroup === this.ASSOCIATED_ACITITY_NODEGROUP_AND_NODE) {
          const resourceId = tile.data[this.ASSOCIATED_ACITITY_NODEGROUP_AND_NODE][0].resourceId;
          const actTiles = await this.fetchTileData(resourceId);
          for (const actTile of actTiles) {
            if (actTile.nodegroup === this.ACTIVITY_NAME_NODEGROUP) {
              const siteName = actTile.data[this.ACTIVITY_NAME_NODE].en.value;
              this.siteName(siteName);
            }
          }
        }

        if (tile.nodegroup === this.CONTACTS_NODEGROUP) {
          for (const dv of tile.display_values) {
            if (dv.nodeid === this.LICENSEE_NODE) {
              this.licensee(dv.value || 'N/A');
            }
          }
        }
      }
    };
  }

  ko.components.register('get-selected-license-details', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
