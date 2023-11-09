define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/widget-labeller.htm'
], function (_, ko, koMapping, uuid, arches, widgetLabeller) {
  function viewModel(params) {
    const self = this;

    _.extend(this, params.form);
    self.tile()?.dirty.subscribe(function (val) {
      self.dirty(val);
    });
    this.graphid = params.graphid
    this.graphids = params.graphids ? params.graphids : [this.graphid]
    
    this.pageVm = params.pageVm;

    self.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    if (this.componentData.parameters.heritageAssetData) {
      heritageAssetId = JSON.parse(this.componentData.parameters.heritageAssetData)['58a2b98f-a255-11e9-9a30-00224800b26d'][0]['resourceId']
      heritageAssetTiles =  self.fetchTileData(heritageAssetId)
      console.log("heritage tiles", heritageAssetTiles)
    }

    if (this.componentData.parameters.prefilledNodes) {
      this.componentData.parameters.prefilledNodes?.forEach((prefill) => {
        Object.keys(self.tile().data).forEach((node) => {
          if (node == prefill[0]){
            console.log("prefilling", prefill)
            console.log(prefill[1])
            self.tile().data[node](prefill[1])
          }
        })
      })
    }

    this.card()?.widgets().forEach((widget) => {
      widget.graphids = this.graphids ? this.graphids : [this.graphid]
      params.labels?.forEach(([prevLabel, newLabel]) => {
        if (widget.label() === prevLabel) {
          widget.label(newLabel)
        }
      })
    });

    params.form.save = async () => {
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        nodegroupId: self.tile().nodegroup_id
      });
      params.form.complete(true);
      params.form.saving(false);
    };
  }

  ko.components.register('widget-labeller', {
    viewModel: viewModel,
    template: widgetLabeller
  });

  return viewModel;
});
