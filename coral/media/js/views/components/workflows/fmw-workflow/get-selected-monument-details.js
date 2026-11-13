import ko from 'knockout';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import { isScheduledMonument } from 'utils/reference-values';
import template from 'templates/views/components/workflows/fmw-workflow/get-selected-monument-details.htm';

  const HERITAGE_ASSET_REFS = [
    ['smr_number', 'SMR Number'],
    ['hb_number', 'HB Number'],
    ['ihr_number', 'IHR Number'],
    ['historic_parks_and_gardens', 'Historic Parks and Gardens Number']
  ];

  const REFERENCE = 'ha_reference';
  const DEFAULT_FIELDS = [
    [REFERENCE],
    ['monument_name', 'Monument Name'],
    ['designation_or_protection_type', 'Designation Type', ', '],
    ['townland', 'Townland'],
    ['b_file_reference_number', 'B File(s)', ',\n']
  ];

  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.labels = params.labels || [];

    // [alias, label, join?]: no join renders one span per value; REFERENCE marks the ref row.
    const fields = params.fields || DEFAULT_FIELDS;
    const noData = params.noData || 'No data available';
    const refFallbackLabel = params.refFallbackLabel || 'Heritage Asset Ref Number';
    const showNodes = [
      ...HERITAGE_ASSET_REFS.map(([alias]) => alias),
      ...fields.map(([alias]) => alias).filter((alias) => alias !== REFERENCE)
    ];

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
        data: { resourceids: resourceIds, show_nodes: showNodes }
        });
      } catch (error) {
        this.selectedMonuments([]);
        return;
      }
      const scheduled = params.showScheduled
        ? await Promise.all(resourceIds.map(isScheduledMonument))
        : [];
      const cards = {};
      resourceIds.forEach((id, index) => {
        const details = response[id] || {};
        const rows = fields.map(([alias, label, join]) => {
          if (alias === REFERENCE) {
            const reference = HERITAGE_ASSET_REFS.find(([refAlias]) => details[refAlias]?.length);
            return reference
              ? { label: reference[1], values: [details[reference[0]][0]] }
              : { label: refFallbackLabel, values: [noData] };
          }
          const texts = (details[alias] || []).map((text) => text.trim());
          if (!texts.length) return { label, values: [noData] };
          return { label, values: join ? [texts.join(join)] : texts };
        });
        if (params.showScheduled) {
          rows.push({ label: 'Scheduled (Yes/ No)', values: [scheduled[index] ? 'Yes' : 'No'] });
        }
        cards[id] = rows;
      });
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
