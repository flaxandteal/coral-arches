define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    '../default-card-util.js',
    'templates/views/components/workflows/default-card-util.htm',
  ], function (_, ko, koMapping, uuid, arches, DefaultCardUtilViewModel, componentTemplate) {
    function viewModel(params) {

    DefaultCardUtilViewModel.apply(this, [params]);

    this.DOCUMENT_REFERENCE_NODE = "d8f74d42-dc6e-11ee-8def-0242ac120006"

        params.disableAdd(true)

        this.tile.data[this.DOCUMENT_REFERENCE_NODE].subscribe((newValue) => {
            if (newValue.en.value != ""){

                params.disableAdd(false)
            }
        })


    }
  
    ko.components.register('excavation-report-step', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });