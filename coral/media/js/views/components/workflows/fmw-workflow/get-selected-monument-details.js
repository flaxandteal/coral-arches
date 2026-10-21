import ko from 'knockout';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import template from 'templates/views/components/workflows/fmw-workflow/get-selected-monument-details.htm';

  const HERITAGE_ASSET_REFS = [
    ['smr_number', 'SMR Number'],
    ['hb_number', 'HB Number'],
    ['ihr_number', 'IHR Number'],
    ['historic_parks_and_gardens', 'Historic Parks and Gardens Number']
  ];

  const SHOW_NODES = [
    ...HERITAGE_ASSET_REFS.map(([alias]) => alias),
    'monument_name',
    'designation_or_protection_type',
    'townland',
    'b_file_reference_number'
  ];

  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.labels = params.labels || [];

    this.selectedMonuments = ko.observable([]);

    this.cards = ko.observable({})

    this.dataNode = params.node;

    this.searchString = params.searchString;

    this.form
      .card()
      ?.widgets()
      .forEach((widget) => {
        this.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });

    this.tile.data[this.dataNode].subscribe((value) => {
      if (value && value.length) {
        const currentResources = value.map(t => ko.unwrap(t.resourceId))
        this.getMonumentDetails(currentResources);
      } else {
        this.selectedMonuments([])
      }
    }, this);

    this.getMonumentDetails = async (resourceIds) => {
      let response;
      try {
        response = await $.ajax({
        type: 'POST',
        url: arches.urls.orm || '/orm/resources',
        dataType: 'json',
        data: { resourceids: resourceIds, show_nodes: SHOW_NODES }
        });
      } catch (error) {
        this.selectedMonuments([]);
        return;
      }
      const cards = {};
      for (const id of resourceIds) {
        const details = response[id] || {};
        const reference = HERITAGE_ASSET_REFS.find(([alias]) => details[alias]?.length);
        cards[id] = {
          haNumberLabel: reference ? reference[1] : 'Heritage Asset Ref Number',
          smrNumber: reference ? details[reference[0]][0] : 'None',
          monumentName: details.monument_name?.[0]?.trim() || 'None',
          designationType: details.designation_or_protection_type?.join(', ') || 'None',
          townlandValue: details.townland?.length ? details.townland : ['None'],
          bFile: details.b_file_reference_number?.join(',\n') || 'None'
        };
      }
      this.cards(cards);
      this.selectedMonuments(resourceIds);
    }

  // This will force a refresh to generate the tile if it already exists - not ideal
  this.tile.data[this.dataNode](this.tile.data[this.dataNode]())

}

  ko.components.register('get-selected-monument-details', {
    viewModel: viewModel,
    template: template
  });

export default viewModel;
