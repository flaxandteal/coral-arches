import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
import template from 'templates/views/components/workflows/fmw-workflow/calculate-composite-score.htm';
import { lookupByListItem } from 'utils/reference-values';

function viewModel(params) {
  CardComponentViewModel.apply(this, [params]);
  this.disabled = ko.observable(true);

  this.CONDITION_SCORE_NODE_ID = 'd1cd09d6-bc22-59e6-b840-46e8a1514442';
  this.RISK_SCORE_NODE_ID = '402dc4cb-4825-5a2b-8366-a5aea6045054';

  // The two nodes shared one set of domain options before v8 and now have a controlled
  // list each, so 1-5 are different ids per node and one lookup can no longer serve both.
  // Kept in step with coral/functions/calculate_composite_score_function.py, which scores
  // the same two nodes server-side.
  this.conditionScoreLookup = {
    '22839192-d6c1-585e-8d47-5dd65a56b656': 1,
    '267f7834-7c3e-5de6-977c-732d929ab071': 2,
    '8f51b776-615d-5ee3-966d-649a630eeccd': 3,
    '118b6274-57ab-5f30-9e98-d6382370704c': 4,
    '269e214f-012e-5053-8d9d-5bcc7e428d49': 5
  };

  this.riskScoreLookup = {
    'be6b45d4-c644-5e9b-9d8b-7e8b36bf31a2': 1,
    '42b793c1-6df2-5951-92df-ba7fc1900926': 2,
    '10566173-79b9-5cb0-abcc-17883dd6c3f2': 3,
    '1ee9a656-7bad-5c9c-b182-ed0166e2598c': 4,
    '37935aa8-578f-5766-a2df-3ddf71fef536': 5
  };

  const conditionScore = (value) => lookupByListItem(value, this.conditionScoreLookup, 0);
  const riskScore = (value) => lookupByListItem(value, this.riskScoreLookup, 0);

  this.totalCompositeScore = ko.observable(
    conditionScore(this.tile.data[this.CONDITION_SCORE_NODE_ID]()) *
      riskScore(this.tile.data[this.RISK_SCORE_NODE_ID]())
  );

  this.tile.data[this.CONDITION_SCORE_NODE_ID].subscribe((value) => {
    this.totalCompositeScore(
      conditionScore(value) * riskScore(this.tile.data[this.RISK_SCORE_NODE_ID]())
    );
  }, this);

  this.tile.data[this.RISK_SCORE_NODE_ID].subscribe((value) => {
    this.totalCompositeScore(
      conditionScore(this.tile.data[this.CONDITION_SCORE_NODE_ID]()) * riskScore(value)
    );
  }, this);
}

ko.components.register('calculate-composite-score', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
