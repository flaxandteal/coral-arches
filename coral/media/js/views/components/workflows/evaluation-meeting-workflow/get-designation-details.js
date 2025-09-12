define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'viewmodels/alert',
    'templates/views/components/workflows/evaluation-meeting-workflow/get-designation-details.htm'
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
    function viewModel(params) {
      CardComponentViewModel.apply(this, [params]);

      this.labels = params.labels || [];
  
      this.selectedResource = ko.observable();
  
      this.grade = ko.observable("Loading...");
  
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
  
      const heritageAssetId = this.tile.data["58a2b98f-a255-11e9-9a30-00224800b26d"]()[0].resourceId

      this.fetchTileData = async (resourceId, nodeId) => {
        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
            (nodeId ? `?nodeid=${nodeId}` : '')
        );
        const data = await tilesResponse.json();
        return data.tiles;
      };
  
      this.prepareResource = async function () {
        const tiles = await this.fetchTileData(heritageAssetId, "6af2b696-efc5-11eb-b0b5-a87eeabdefba")
        for (const tile of tiles) {
          const gradeData = _.filter(tile.display_values, (value) => {return value.nodeid === '6af2b696-efc5-11eb-b0b5-a87eeabdefba'})
          this.grade(gradeData[0].value !== "" ? gradeData[0].value : "None")
        }
        if (this.grade() === "Loading...") {
          this.grade("None")
        }
      }
      this.prepareResource()

    }
  
    ko.components.register('get-designation-details', {
      viewModel: viewModel,
      template: template
    });
  
    return viewModel;
  });
  