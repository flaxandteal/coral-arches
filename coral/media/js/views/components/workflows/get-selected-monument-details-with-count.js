import ko from 'knockout';
import SharedViewModel from 'views/components/workflows/fmw-workflow/get-selected-monument-details';
import { isScheduledMonument } from 'utils/reference-values';
import template from 'templates/views/components/workflows/fmw-workflow/get-selected-monument-details.htm';

const MONUMENT_COUNT_NODE = 'a7d5d94e-1094-568a-ab49-bdd9362a1485';
const SCHEDULED_MONUMENT_COUNT_NODE = '4cbfed23-7989-500c-9a0f-c63307d15beb';
const HA_NODE = '0f74af35-a8d7-5a12-953a-1773d3981fec';

function viewModel(params) {
  SharedViewModel.apply(this, [params]);

  if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
    this.tile.data[HA_NODE].subscribe(async (newValue) => {
      this.tile.data[MONUMENT_COUNT_NODE](newValue.length);
      const scheduled = await Promise.all(
        newValue.map((item) => isScheduledMonument(ko.unwrap(item.resourceId)))
      );
      this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE](scheduled.filter(Boolean).length);
    });
  }
}

ko.components.register('get-selected-monument-details-with-count', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
