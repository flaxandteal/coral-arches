import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import { selectedListItemIds } from 'utils/reference-values';
import AlertViewModel from 'viewmodels/alert';
import template from 'templates/views/components/workflows/assign-consultation-workflow/show-hierarchy-change.htm';

function viewModel(params) {
  CardComponentViewModel.apply(this, [params]);

  this.APPLICATION_TYPE_NODEGROUP = '54de6acc-8895-11ea-9067-f875a44e0e11';

  this.HIERARCHY_STATUTORY = '609367b4-8a68-5f5c-8713-409d33629213';
  this.HIERARCHY_NON_STATUTORY = '34315588-70f4-5643-a4fb-c5ee13a8aa37';
  this.HIERARCHY_UNSET = '09646513-78ed-4f20-b9a9-11dc0fdca36b';

  this.hierarchyOptions = ko.observableArray([
    { text: 'Statutory', id: this.HIERARCHY_STATUTORY },
    { text: 'Non-statutory', id: this.HIERARCHY_NON_STATUTORY },
    { text: 'Please select an Application Type', id: this.HIERARCHY_UNSET }
  ]);
  this.selectedHierarchy = ko.observable();

  this.configKeys = ko.observable({ placeholder: 0 });

  this.disabled = ko.observable(true);

  // UNRESOLVED, as in coral/functions/consultation_hierarchy_function.py. Application Type
  // keeps its id but is bound to arches-her's list now, which has no "F - Full" /
  // "O - Outline" / "RM - Reserved Matter". Until the data owner maps them, nothing
  // matches and every consultation reads as non-statutory — the same as before.
  this.STATUTORY_VALUES = [
    '7b87dd7a-7573-4417-9691-0875a783e8c2', // F - Full
    '32d2e13f-31fb-4031-9bbb-cd159c76a28e', // O - Outline
    '83fe6c2e-bfbb-4a75-8a46-df8baf05e999' // RM - Reserved Matter
  ];

  this.hierarchyFor = (value) => {
    const selected = selectedListItemIds(value);
    if (!selected.length) return this.HIERARCHY_UNSET;
    return selected.some((id) => this.STATUTORY_VALUES.includes(id))
      ? this.HIERARCHY_STATUTORY
      : this.HIERARCHY_NON_STATUTORY;
  };

  this.tile.data[this.APPLICATION_TYPE_NODEGROUP].subscribe((value) => {
    this.selectedHierarchy(this.hierarchyFor(value));
  }, this);

  this.selectedHierarchy(this.hierarchyFor(this.tile.data[this.APPLICATION_TYPE_NODEGROUP]()));
}

ko.components.register('show-hierarchy-change', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
