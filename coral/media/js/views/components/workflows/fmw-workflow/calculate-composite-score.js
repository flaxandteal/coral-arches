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
    this.disabled = ko.observable(true);

    this.CONDITION_SCORE_NODE_ID = '73679068-0c52-11ef-a9bf-0242ac140006';
    this.RISK_SCORE_NODE_ID = '094eb7ce-0c52-11ef-8f48-0242ac140006';

    this.scoreLookup = {
      'd81fa421-35f3-4f30-95fa-c042f424c83a': 1,
      '56342ba4-538c-4650-8285-23af0a3cc523': 2,
      '7b758df3-5722-4c76-8785-ea9a715e420e': 3,
      'd2db1732-5b6e-4a7d-b84f-8bff6e541cff': 4,
      'ef491947-178e-4f62-92ac-192fa6424592': 5
    };

    this.totalCompositeScore = ko.observable(
      this.tile.data[this.CONDITION_SCORE_NODE_ID]() && this.tile.data[this.RISK_SCORE_NODE_ID]()
        ? this.scoreLookup[this.tile.data[this.CONDITION_SCORE_NODE_ID]()] *
            this.scoreLookup[this.tile.data[this.RISK_SCORE_NODE_ID]()]
        : 0
    );

    this.tile.data[this.CONDITION_SCORE_NODE_ID].subscribe((value) => {
      const conditionScoreValue = this.scoreLookup[value] || 0;
      const riskScoreValue = this.scoreLookup[this.tile.data[this.RISK_SCORE_NODE_ID]()] || 0;
      this.totalCompositeScore(conditionScoreValue * riskScoreValue);
    }, this);

    this.tile.data[this.RISK_SCORE_NODE_ID].subscribe((value) => {
      const riskScoreValue = this.scoreLookup[value] || 0;
      const conditionScoreValue =
        this.scoreLookup[this.tile.data[this.CONDITION_SCORE_NODE_ID]()] || 0;
      this.totalCompositeScore(conditionScoreValue * riskScoreValue);
    }, this);
  }

  ko.components.register('calculate-composite-score', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
