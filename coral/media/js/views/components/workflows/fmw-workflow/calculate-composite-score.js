import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
import template from 'templates/views/components/workflows/fmw-workflow/calculate-composite-score.htm';

function viewModel(params) {
  CardComponentViewModel.apply(this, [params]);
  this.disabled = ko.observable(true);

  this.CONDITION_SCORE_NODE_ID = 'd1cd09d6-bc22-59e6-b840-46e8a1514442';
  this.RISK_SCORE_NODE_ID = '402dc4cb-4825-5a2b-8366-a5aea6045054';

  // Condition Score / Risk Score are reference (controlled-list) fields, so
  // the tile value is [{uri, labels, list_id}]; each list item's prefLabel
  // is itself the numeric score ("1".."5"), so just parse it directly.
  this.getScoreValue = (value) => {
    const reference = value && value[0];
    const label = reference?.labels?.find((l) => l.valuetype_id === 'prefLabel');
    const parsed = label ? parseInt(label.value, 10) : NaN;
    return isNaN(parsed) ? 0 : parsed;
  };

  this.totalCompositeScore = ko.observable(
    this.getScoreValue(this.tile.data[this.CONDITION_SCORE_NODE_ID]()) *
      this.getScoreValue(this.tile.data[this.RISK_SCORE_NODE_ID]())
  );

  this.tile.data[this.CONDITION_SCORE_NODE_ID].subscribe((value) => {
    const conditionScoreValue = this.getScoreValue(value);
    const riskScoreValue = this.getScoreValue(this.tile.data[this.RISK_SCORE_NODE_ID]());
    this.totalCompositeScore(conditionScoreValue * riskScoreValue);
  }, this);

  this.tile.data[this.RISK_SCORE_NODE_ID].subscribe((value) => {
    const riskScoreValue = this.getScoreValue(value);
    const conditionScoreValue = this.getScoreValue(this.tile.data[this.CONDITION_SCORE_NODE_ID]());
    this.totalCompositeScore(conditionScoreValue * riskScoreValue);
  }, this);
}

ko.components.register('calculate-composite-score', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
