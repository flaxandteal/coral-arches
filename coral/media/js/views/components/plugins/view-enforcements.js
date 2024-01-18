define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/view-enforcements.htm'
], function ($, ko, koMapping, arches, pageTemplate) {
  const pageViewModel = function (params) {
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
            { op: 'and', 'c9711ef6-b555-11ee-baf6-0242ac120006': { op: 'null', val: '' } },
            {
              op: 'or',
              'c9711ef6-b555-11ee-baf6-0242ac120006': {
                op: 'eq',
                val: '185bbad6-eb0f-424d-8802-fb4d93a64625'
              }
            },
            {
              op: 'or',
              'c9711ef6-b555-11ee-baf6-0242ac120006': {
                op: 'eq',
                val: '58f1046b-2d43-4cd3-9636-436893e0ac6d'
              }
            }
          ])
        },
        context: this,
        success: async function (response) {
          console.log('response: ', response);
          console.log('arches.urls: ', arches.urls);
          console.log(
            'arches.urls.resource_tiles: ',
            arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '')
          );

          const enforcements = response.results.hits.hits.map((hit) => {
            return hit._source;
          });

          for (const enforcement of enforcements) {
            enforcement.tiles = (await $.getJSON(
              arches.urls.resource_tiles.replace(
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                enforcement.resourceinstanceid
              )
            )).tiles;
          }

          this.consultations(enforcements);
          console.log('this.consultations: ', this.consultations());
        },
        error: function (response, status, error) {},
        complete: function (request, status) {}
      });
    };

    this.getDescription = (consultation) => {
      console.log('consultation: ', consultation);
      const descriptionTile = consultation.tiles.find((tile) => {
        return tile.nodegroup === '89bf628e-b552-11ee-805b-0242ac120006';
      });
      const statusTile = consultation.tiles.find((tile) => {
        return tile.nodegroup === 'ac823b90-b555-11ee-805b-0242ac120006';
      });
      console.log('descriptionTile: ', descriptionTile);
      return {
        status: statusTile?.data['c9711ef6-b555-11ee-baf6-0242ac120006'],
        description:
          descriptionTile?.data['89bf6c48-b552-11ee-805b-0242ac120006'][arches.activeLanguage][
            'value'
          ]
      };
    };

    this.getStatusText = (nodeValueId) => {
      switch (nodeValueId) {
        case '185bbad6-eb0f-424d-8802-fb4d93a64625':
          return 'Received';
        case '58f1046b-2d43-4cd3-9636-436893e0ac6d':
          return 'In progress';
        case 'f3dcfd61-4b71-4d1d-8cd3-a7abb52d861b':
          return 'Closed';
        default:
          return 'New';
      }
    };

    this.redirectUrl = ko.observable();

    this.openFlagged = (resourceId) => {
      let url = arches.urls.plugin(
        `edit-workflow?workflow-slug=process-flagged-enforcement-workflow&resource-id=${resourceId}`
      );
      this.redirectUrl(url);
    };

    this.init = async () => {
      this.checkOpenApplications();
    };

    this.init();
  };

  return ko.components.register('view-enforcements', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
});
