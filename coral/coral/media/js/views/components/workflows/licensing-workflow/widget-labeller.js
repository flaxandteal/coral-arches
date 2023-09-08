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
    self.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });
    this.graphid = params.graphid
    this.graphids = params.graphids ? params.graphids : [this.graphid]
    
    this.pageVm = params.pageVm;


    if (this.componentData.parameters.prefilledNodes) {
      this.componentData.parameters.prefilledNodes?.forEach((prefill) => {
        Object.keys(self.tile().data).forEach((node) => {
          if (node == prefill[0]){
            self.tile().data[node](prefill[1])
          }
        })
      })
    }

    this.card().widgets().forEach((widget) => {
      // console.log('widget loop: ', widget);
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
