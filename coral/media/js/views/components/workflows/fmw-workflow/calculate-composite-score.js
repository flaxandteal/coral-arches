define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/fmw-workflow/calculate-composite-score.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    // this.APPLICATION_TYPE_NODEGROUP = '54de6acc-8895-11ea-9067-f875a44e0e11';

    // this.hierarchyOptions = ko.observableArray([
    //   { text: 'Statutory', id: 'd06d5de0-2881-4d71-89b1-522ebad3088d' },
    //   { text: 'Non-statutory', id: 'be6eef20-8bd4-4c64-abb2-418e9024ac14' }
    // ]);
    // this.selectedHierarchy = ko.observable();

    // this.configKeys = ko.observable({ placeholder: 0 });

    // this.disabled = ko.observable(true);

    // this.STATUTORY_VALUES = [
    //   '7b87dd7a-7573-4417-9691-0875a783e8c2', // F - Full
    //   '32d2e13f-31fb-4031-9bbb-cd159c76a28e', // O - Outline
    //   '83fe6c2e-bfbb-4a75-8a46-df8baf05e999' // RM - Reserved Matter
    // ];

    // this.tile.data['54de6acc-8895-11ea-9067-f875a44e0e11'].subscribe((value) => {
    //   if (this.STATUTORY_VALUES.includes(value)) {
    //     this.selectedHierarchy('d06d5de0-2881-4d71-89b1-522ebad3088d');
    //   } else {
    //     this.selectedHierarchy('be6eef20-8bd4-4c64-abb2-418e9024ac14');
    //   }
    // }, this);

    // if (this.STATUTORY_VALUES.includes(this.tile.data['54de6acc-8895-11ea-9067-f875a44e0e11']())) {
    //   this.selectedHierarchy('d06d5de0-2881-4d71-89b1-522ebad3088d');
    // } else {
    //   this.selectedHierarchy('be6eef20-8bd4-4c64-abb2-418e9024ac14');
    // }
  }

  ko.components.register('calculate-composite-score', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
