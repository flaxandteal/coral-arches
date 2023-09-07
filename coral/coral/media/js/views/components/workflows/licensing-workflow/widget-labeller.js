define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/widget-labeller.htm'
], function (_, ko, koMapping, uuid, arches, widgetLabeller) {
  function viewModel(params) {
    console.log(this)
    const self = this;

    _.extend(this, params.form);
    console.log(params)
    console.log("LABELLER", params.form)
    console.log("THIS", this.card())
    console.log("FORM", params.form.card())

    console.log("SELF", self.tile(), self.card(), self)
    console.log("Cards for Graph", self.graphModel.graphCards())
    self.form.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });

    console.log("so long tile then", self.tile())
    this.graphid = params.graphid
    this.graphids = params.graphids ? params.graphids : [this.graphid]
    
    console.log("tile me",this.tile())
    console.log("graph and id!", this.graphid, this.graphids)

    console.log(params.nodegroupId)

    this.pageVm = params.pageVm;

    this.card().widgets().forEach((widget) => {
      console.log('widget loop: ', widget);
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
