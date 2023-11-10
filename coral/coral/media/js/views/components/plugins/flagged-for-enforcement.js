define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/flagged-for-enforcement.htm'
], function ($, ko, koMapping, arches, flaggedForEnforcementTemplate) {
  const flaggedForEnforcementViewModel = function (params) {
    this.consultations = ko.observable([]);

    this.checkOpenApplications = async () => {
      if (this.flaggedConsultations) {
        this.flaggedConsultations.abort();
      }

      this.flaggedConsultations = $.ajax({
        type: 'GET',
        url: arches.urls.search_results,
        data: {
          'paging-filter': 1,
          tiles: true,
          format: 'tilecsv',
          reportlink: 'false',
          precision: '6',
          total: '0',
          'advanced-search': JSON.stringify([
            {
              op: 'and',
              'ec9c324c-7fc9-11ee-ab5a-0242ac130008': { val: 't' },
              '3f7e60a2-7fca-11ee-9154-0242ac130008': { op: 'not_null', lang: 'en', val: '' }
            }
          ])
        },
        context: this,
        success: function (response) {
          console.log('response: ', response);
          this.consultations(
            response.results.hits.hits.map((hit) => {
              return hit._source;
            })
          );
          console.log('this.consultations: ', this.consultations());
        },
        error: function (response, status, error) {},
        complete: function (request, status) {}
      });
    };

    this.getDescription = (consultation) => {
      console.log('consultation: ', consultation);
      const descriptionTile = consultation.tiles.find((tile) => {
        return tile.nodegroup_id === '8e5cdd80-7fc9-11ee-b550-0242ac130008';
      });
      console.log('descriptionTile: ', descriptionTile);
      return {
        required: descriptionTile.data['ec9c324c-7fc9-11ee-ab5a-0242ac130008'],
        description:
          descriptionTile.data['3f7e60a2-7fca-11ee-9154-0242ac130008'][arches.activeLanguage][
            'value'
          ]
      };
    };

    this.init = async () => {
      this.checkOpenApplications();
    };

    this.init();
  };

  return ko.components.register('flagged-for-enforcement', {
    viewModel: flaggedForEnforcementViewModel,
    template: flaggedForEnforcementTemplate
  });
});
