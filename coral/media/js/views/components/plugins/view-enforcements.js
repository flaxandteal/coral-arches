/* eslint-disable */
define([
  'jquery',
  'knockout',
  'underscore',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/view-enforcements.htm',
  'views/components/search/paging-filter'
], function ($, ko, _, koMapping, arches, pageTemplate) {
  const pageViewModel = function (params) {
    this.tasks = ko.observable([]);
    this.currentPage = ko.observable(1)
    this.pageSize = ko.observable(12);
    this.filterOptions = ko.observableArray([
      {name: 'All', id: 'all'},
      {name: 'New', id: 'new'},
      {name: 'Received', id: 'received'},
      {name: 'In Progress', id: 'inProgress'},
      {name: 'Closed', id: 'closed'}
    ]);
    this.filterBy = ko.observable('all');

    this.paginator = koMapping.fromJS({
        current_page: 1,
        end_index: 1,
        has_next: false,
        has_other_pages: true,
        has_previous: false,
        next_page_number: 2,
        pages: [],
        previous_page_number: null,
        start_index: 1
    });

    this.totalPages = ko.computed(() => {
      return Math.ceil(this.tasks().length / this.pageSize());
    });

    this.hasNextPage = ko.computed(() => {
      return this.currentPage() < this.totalPages();
    });

    this.hasPreviousPage = ko.computed(() => {
      return this.currentPage() > 1;
    });

    this.newPage = async (pageNumber) => {
      this.currentPage(pageNumber);
      this.updatePaginatedItems();
    };

    this.nextPage = () => {
      if (this.hasNextPage()) {
        this.currentPage(this.currentPage() + 1);
        this.updatePaginatedItems();
      }
    };

    this.previousPage = () => {
      if (this.hasPreviousPage()) {
        this.currentPage(this.currentPage() - 1);
        this.updatePaginatedItems();
      }
    };

    this.setPageSize = (size) => {
      this.pageSize(size);
      this.currentPage(1); // Reset to the first page when page size changes
      this.updatePaginatedItems();
    };

    this.getTileData = async (resources) => {
      const promises = resources.map(async (resource) => {
        const response = await $.getJSON(
          arches.urls.resource_tiles.replace(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            resource.resourceinstanceid
          )
        );
        resource.tiles = response.tiles;
        return resource;
      });
    
      return Promise.all(promises);
    };

    this.filterBy.subscribe((newVal) => {
      switch (newVal) {
        case 'all':
          this.fetchEnforcements(this.searchAll);
          break;
        case 'new':
          this.fetchEnforcements(this.searchNew);
          break;
        case 'received':
            this.fetchEnforcements(this.searchReceived);
            break;
        case 'inProgress':
          this.fetchEnforcements(this.searchInProgress);
          break;
        case 'closed':
          this.fetchEnforcements(this.searchClosed);
          break;
        default:
          this.fetchEnforcements(this.searchAll);
      }
    });

    this.paginatedItems = ko.observableArray([]);

    this.updatePaginatedItems = async () => {
      const pageSize = this.pageSize();
      const currentPage = this.currentPage();
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = this.tasks().slice(startIndex, endIndex);

      const updatedItems = await this.getTileData(paginatedItems);
      this.paginatedItems(updatedItems);

      this.paginator.current_page(currentPage);
      this.paginator.start_index(startIndex + 1);
      this.paginator.end_index(endIndex);
      this.paginator.has_next(currentPage < this.totalPages());
      this.paginator.has_previous(currentPage > 1);
      this.paginator.next_page_number(currentPage < this.totalPages() ? currentPage + 1 : null);
      this.paginator.previous_page_number(currentPage > 1 ? currentPage - 1 : null);
      this.paginator.pages(Array.from({ length: this.totalPages() }, (_, i) => i + 1));
      this.paginator.has_other_pages(this.totalPages() > 1);
    };

    this.searchAll = JSON.stringify([
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
      },
      {
        op: 'or',
        'c9711ef6-b555-11ee-baf6-0242ac120006': {
          op: 'eq',
          val: 'f3dcfd61-4b71-4d1d-8cd3-a7abb52d861b'
        }
      }
    ]),

    this.searchNew = JSON.stringify([
      { op: 'and', 'c9711ef6-b555-11ee-baf6-0242ac120006': { op: 'null', val: '' } },
    ]);
    
    this.searchReceived = JSON.stringify([
      {
        op: 'and',
        'c9711ef6-b555-11ee-baf6-0242ac120006': {
          op: 'eq',
          val: '185bbad6-eb0f-424d-8802-fb4d93a64625'
        }
      }
    ]),

    this.searchInProgress = JSON.stringify([
      {
        op: 'and',
        'c9711ef6-b555-11ee-baf6-0242ac120006': {
          op: 'eq',
          val: '58f1046b-2d43-4cd3-9636-436893e0ac6d'
        }
      }
    ]),

    this.searchClosed = JSON.stringify([
      {
        op: 'and',
        'c9711ef6-b555-11ee-baf6-0242ac120006': {
          op: 'eq',
          val: 'f3dcfd61-4b71-4d1d-8cd3-a7abb52d861b'
        }
      }
    ]),

    this.searchParams = (advanceSearch) => new URLSearchParams({
          'advanced-search': advanceSearch,
          tiles: true,
          pages: 10
      });

    this.fetchEnforcements = async (advanceSearch) => {
        const searchParams = this.searchParams(advanceSearch);
        return window.fetch(`${arches.urls.search_results}?${searchParams}`)
          .then((response) => {
              if (response.ok) {
                  return response.json();
              }
          })
          .then(async (json) => {
            const enforcements = json.results.hits.hits.map((hit) => {
              return hit._source;
            });
            
            this.tasks(enforcements);
            this.updatePaginatedItems();
          });
      }, 

    this.getDescription = (consultation) => {
      const descriptionTile = consultation.tiles.find((tile) => {
        return tile.nodegroup === '89bf628e-b552-11ee-805b-0242ac120006';
      });
      return descriptionTile?.data['89bf6c48-b552-11ee-805b-0242ac120006'][arches.activeLanguage]['value']
    };

    this.getStatus = (consultation) => {
      const statusTile = consultation.tiles.find((tile) => {
        return tile.nodegroup === 'ac823b90-b555-11ee-805b-0242ac120006';
      });
      return statusTile?.data['c9711ef6-b555-11ee-baf6-0242ac120006']
    }

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

    this.openFlagged = (resourceId) => {
      let url = arches.urls.plugin(
        `open-workflow?workflow-slug=respond-to-enforcement-workflow&resource-id=${resourceId}`
      );
      window.location.href = url;
    };

    this.init = async () => {
      await this.fetchEnforcements(this.searchAll);
    };

    this.init();
  }

  return ko.components.register('view-enforcements', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
});
