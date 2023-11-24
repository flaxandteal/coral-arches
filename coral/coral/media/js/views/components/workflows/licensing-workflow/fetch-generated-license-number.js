define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/fetch-generated-license-number.htm'
], function (_, ko, koMapping, uuid, arches, componentTemplate) {
  function viewModel(params) {
    // _.extend(this, params.form);
    // this.tile()?.dirty.subscribe(function (val) {
    //   console.log('this: ', val);
    //   // this.dirty(val);
    // });

    // console.log('this.tile(): ', this.tile());

    this.STATUS_NODE = 'fb18edd0-48b8-11ee-84da-0242ac140007';
    this.STATUS_FINAL_VALUE = '8c454982-c470-437d-a9c6-87460b07b3d9';
    this.EXTERNAL_REF_NUMBER_NODE = '280b75bc-4e4d-11ee-a340-0242ac140007';

    // params.form.save = async () => {
    //   await this.tile().save();
    //   params.form.savedData({
    //     tileData: koMapping.toJSON(this.tile().data),
    //     tileId: this.tile().tileid,
    //     resourceInstanceId: this.tile().resourceinstance_id,
    //     nodegroupId: this.tile().nodegroup_id
    //   });
    //   console.log('finished saving');
    //   if (tile.data[STATUS_NODE] === STATUS_FINAL_VALUE) {
    //     console.log('status was final');
    //     const response = await this.getLicenseRefTileId();
    //     if (response.ok) {
    //       console.log('response: ', response);
    //     }
    //   }
    //   params.form.complete(true);
    //   params.form.saving(false);
    // };
    const self = this;

    _.extend(this, params.form);
    self.tile()?.dirty.subscribe(function (val) {
      self.dirty(val);
    });

    this.fetchTileData = async (resourceId, nodeValue) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeValue ? `?nodeid=${nodeValue}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.getLicenseRefTileId = async () => {
      console.log('arches.urls: ', arches.urls);
      const tiles = await this.fetchTileData(this.resourceId(), this.EXTERNAL_REF_NUMBER_NODE);
      console.log('tiles: ', tiles);
      // const response = await window.fetch(
      //   arches.urls.resource_tiles(this.resourceId() + '?format=json&compact=false')
      // );

      // if (response.ok) {
      //   const data = await response.json();
      //   if (data.resource['External Cross References']) {
      //     const licenseNumberRef = data.resource['External Cross References'].find((ref) => {
      //       if (ref['External Cross Reference Source']['@value'] === 'Excavation') {
      //         return ref;
      //       }
      //     });
      //     this.licenseNumberTileId =
      //       licenseNumberRef['External Cross Reference Number']['@tile_id'];
      //   }
      // }
      // return response;
    };

    params.form.save = async () => {
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        nodegroupId: self.tile().nodegroup_id
      });
      console.log('finished saving: ', self.tile().data);
      if (self.tile().data[this.STATUS_NODE]() === this.STATUS_FINAL_VALUE) {
        console.log('status was final');
        const response = await this.getLicenseRefTileId();
        // console.log()
      }
      params.form.complete(true);
      params.form.saving(false);
    };
  }

  ko.components.register('fetch-generated-license-number', {
    viewModel: viewModel,
    template: componentTemplate
  });

  return viewModel;
});
