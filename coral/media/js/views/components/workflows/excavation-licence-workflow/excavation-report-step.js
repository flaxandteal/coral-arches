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
    this.CLASSIFICATION_DATE_NODE = "ea6ea7a8-dc70-11ee-b70c-0242ac120006"

    params.disableAdd(true)

    

    const checkBothNodes = (classificationDate, docReference) => {
      params.disableAdd(true)
      if (classificationDate !== null && ko.unwrap(docReference) !== ''){
        params.disableAdd(false)
      }
    }

    this.tile.data[this.CLASSIFICATION_DATE_NODE].subscribe((newValue) => {
      const documentReferenceValue = this.tile.data[this.DOCUMENT_REFERENCE_NODE]().en.value;
      checkBothNodes(newValue, documentReferenceValue);
    });

    this.tile.data[this.DOCUMENT_REFERENCE_NODE].subscribe((newValue) => {
      const classificationDateValue = this.tile.data[this.CLASSIFICATION_DATE_NODE]();
      checkBothNodes(classificationDateValue, newValue.en.value);
    });

  }

  ko.components.register('excavation-report-step', {
    viewModel: viewModel,
    template: componentTemplate
  });

  return viewModel;
});