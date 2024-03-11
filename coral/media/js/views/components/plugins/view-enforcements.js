define([
  'jquery',
  'knockout',
  'underscore',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/view-enforcements.htm',
  'views/components/search/paging-filter'
], function ($, ko, _, koMapping, arches, pageTemplate) {
  const CommonSearchViewModel = function () {
    var getQueryObject = function () {
      return {
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
      };
    };

    const SearchComponents = {
      '7aff5819-651c-4390-9b9a-a61221ba52c6': {
        classname: 'PagingFilter',
        componentname: 'paging-filter',
        componentpath: 'views/components/search/paging-filter',
        enabled: true,
        icon: '',
        modulename: 'paging_filter.py',
        name: 'Paging',
        searchcomponentid: '7aff5819-651c-4390-9b9a-a61221ba52c6',
        sortorder: 0,
        type: 'paging'
      },
      '09d97fc6-8c83-4319-9cef-3aaa08c3fbec': {
        classname: 'MapFilter',
        componentname: 'map-filter',
        componentpath: 'views/components/search/map-filter',
        enabled: true,
        icon: 'fa fa-map-marker',
        modulename: 'map_filter.py',
        name: 'Map Filter',
        searchcomponentid: '09d97fc6-8c83-4319-9cef-3aaa08c3fbec',
        sortorder: 0,
        type: 'filter'
      },
      '00673743-8c1c-4cc0-bd85-c073a52e03ec': {
        classname: 'SearchResultsFilter',
        componentname: 'search-results',
        componentpath: 'views/components/search/search-results',
        enabled: true,
        icon: '',
        modulename: 'search_results.py',
        name: 'Search Results',
        searchcomponentid: '00673743-8c1c-4cc0-bd85-c073a52e03ec',
        sortorder: 0,
        type: 'results-list'
      },
      'f0e56205-acb5-475b-9c98-f5e44f1dbd2c': {
        classname: 'AdvancedSearch',
        componentname: 'advanced-search',
        componentpath: 'views/components/search/advanced-search',
        enabled: true,
        icon: 'fa fa-check-circle-o',
        modulename: 'advanced_search.py',
        name: 'Advanced',
        searchcomponentid: 'f0e56205-acb5-475b-9c98-f5e44f1dbd2c',
        sortorder: 3,
        type: 'filter'
      },
      '7497ed4f-2085-40da-bee5-52076a48bcb1': {
        classname: 'TimeFilter',
        componentname: 'time-filter',
        componentpath: 'views/components/search/time-filter',
        enabled: true,
        icon: 'fa fa-calendar',
        modulename: 'time_filter.py',
        name: 'Time Filter',
        searchcomponentid: '7497ed4f-2085-40da-bee5-52076a48bcb1',
        sortorder: 1,
        type: 'popup'
      },
      '1f42f501-ed70-48c5-bae1-6ff7d0d187da': {
        classname: 'TermFilter',
        componentname: 'term-filter',
        componentpath: 'views/components/search/term-filter',
        enabled: true,
        icon: '',
        modulename: 'term_filter.py',
        name: 'Term Filter',
        searchcomponentid: '1f42f501-ed70-48c5-bae1-6ff7d0d187da',
        sortorder: 0,
        type: 'text-input'
      },
      '073406ed-93e5-4b5b-9418-b61c26b3640f': {
        classname: 'ProvisionalFilter',
        componentname: 'provisional-filter',
        componentpath: 'views/components/search/provisional-filter',
        enabled: true,
        icon: '',
        modulename: 'provisional_filter.py',
        name: 'Provisional Filter',
        searchcomponentid: '073406ed-93e5-4b5b-9418-b61c26b3640f',
        sortorder: 0,
        type: ''
      },
      '59f28272-d1f1-4805-af51-227771739aed': {
        classname: '',
        componentname: 'related-resources-filter',
        componentpath: 'views/components/search/related-resources-filter',
        enabled: true,
        icon: 'fa fa-code-fork',
        modulename: '',
        name: 'Related',
        searchcomponentid: '59f28272-d1f1-4805-af51-227771739aed',
        sortorder: 4,
        type: 'filter'
      },
      'f1c46b7d-0132-421b-b1f3-95d67f9b3980': {
        classname: 'ResourceTypeFilter',
        componentname: 'resource-type-filter',
        componentpath: 'views/components/search/resource-type-filter',
        enabled: true,
        icon: '',
        modulename: 'resource_type_filter.py',
        name: 'Resource Type Filter',
        searchcomponentid: 'f1c46b7d-0132-421b-b1f3-95d67f9b3980',
        sortorder: 0,
        type: 'resource-type-filter'
      },
      '6dc29637-43a1-4fba-adae-8d9956dcd3b9': {
        classname: 'SavedSearches',
        componentname: 'saved-searches',
        componentpath: 'views/components/search/saved-searches',
        enabled: true,
        icon: 'fa fa-bookmark',
        modulename: 'saved_searches.py',
        name: 'Saved',
        searchcomponentid: '6dc29637-43a1-4fba-adae-8d9956dcd3b9',
        sortorder: 2,
        type: 'popup'
      },
      '9c6a5a9c-a7ec-48d2-8a25-501b55b8eff6': {
        classname: 'SearchExport',
        componentname: 'search-export',
        componentpath: 'views/components/search/search-export',
        enabled: true,
        icon: 'fa fa-download',
        modulename: 'search_export.py',
        name: 'Search Export',
        searchcomponentid: '9c6a5a9c-a7ec-48d2-8a25-501b55b8eff6',
        sortorder: 3,
        type: 'popup'
      },
      'f5986dae-8b01-11ea-b65a-77903936669c': {
        classname: '',
        componentname: 'search-result-details',
        componentpath: 'views/components/search/search-result-details',
        enabled: true,
        icon: 'fa fa-info-circle',
        modulename: '',
        name: 'Details',
        searchcomponentid: 'f5986dae-8b01-11ea-b65a-77903936669c',
        sortorder: 4,
        type: 'filter'
      },
      '6a2fe122-de54-4e44-8e93-b6a0cda7955c': {
        classname: 'SortResults',
        componentname: 'sort-results',
        componentpath: 'views/components/search/sort-results',
        enabled: true,
        icon: '',
        modulename: 'sort_results.py',
        name: 'Sort',
        searchcomponentid: '6a2fe122-de54-4e44-8e93-b6a0cda7955c',
        sortorder: 0,
        type: ''
      }
    };
    this.filters = {};
    this.filtersList = _.sortBy(
      Object.values(SearchComponents),
      function (filter) {
        return filter.sortorder;
      },
      this
    );
    Object.values(SearchComponents).forEach(function (component) {
      this.filters[component.componentname] = ko.observable(null);
    }, this);
    var firstEnabledFilter = _.find(
      this.filtersList,
      function (filter) {
        return filter.type === 'filter' && filter.enabled === true;
      },
      this
    );
    this.selectedTab = ko.observable(firstEnabledFilter.componentname);
    this.selectedPopup = ko.observable('');
    this.resultsExpanded = ko.observable(true);
    this.query = ko.observable(getQueryObject());
    this.clearQuery = function () {
      Object.values(this.filters).forEach(function (value) {
        if (value()) {
          if (value().clear) {
            value().clear();
          }
        }
      }, this);
      this.query({ 'paging-filter': '1', tiles: 'true' });
    };
    this.filterApplied = ko.pureComputed(function () {
      var self = this;
      var filterNames = Object.keys(this.filters);
      return filterNames.some(function (filterName) {
        if (ko.unwrap(self.filters[filterName]) && filterName !== 'paging-filter') {
          return !!ko.unwrap(self.filters[filterName]).query()[filterName];
        } else {
          return false;
        }
      });
    }, this);
    this.mouseoverInstanceId = ko.observable();
    this.mapLinkData = ko.observable(null);
    this.userIsReviewer = ko.observable(false);
    this.userid = ko.observable(null);
    this.searchResults = { timestamp: ko.observable() };
    this.selectPopup = function (componentname) {
      if (this.selectedPopup() !== '' && componentname === this.selectedPopup()) {
        this.selectedPopup('');
      } else {
        this.selectedPopup(componentname);
      }
    };
    this.isResourceRelatable = function (graphId) {
      var relatable = false;
      if (this.graph) {
        relatable = _.contains(this.graph.relatable_resource_model_ids, graphId);
      }
      return relatable;
    };
    this.toggleRelationshipCandidacy = function () {
      var self = this;
      return function (resourceinstanceid) {
        var candidate = _.contains(self.relationshipCandidates(), resourceinstanceid);
        if (candidate) {
          self.relationshipCandidates.remove(resourceinstanceid);
        } else {
          self.relationshipCandidates.push(resourceinstanceid);
        }
      };
    };
  };

  const pageViewModel = function (params) {
    this.commonSearchModel = new CommonSearchViewModel();
    this.consultations = ko.observable([]);
    this.total = ko.observable();
    this.hits = ko.observable();
    this.commonSearchModel.total = this.total;
    this.commonSearchModel.loading = params.loading;
    // this.viewModel.sharedStateObject.resources = this.viewModel.resources;
    // this.viewModel.sharedStateObject.userCanEditResources = this.viewModel.userCanEditResources;
    // this.viewModel.sharedStateObject.userCanReadResources = this.viewModel.userCanReadResources;

    this.queryString = ko.computed(function () {
      return JSON.stringify(this.commonSearchModel.query());
    }, this);

    this.queryString.subscribe(function () {
      this.checkOpenApplications();
    }, this);

    this.checkOpenApplications = async () => {
      if (this.flaggedConsultations) {
        this.flaggedConsultations.abort();
      }
      var queryString = JSON.parse(this.queryString());
      this.flaggedConsultations = $.ajax({
        type: 'GET',
        url: arches.urls.search_results,
        data: queryString,
        context: this,
        success: async function (response) {
          const enforcements = response.results.hits.hits.map((hit) => {
            return hit._source;
          });

          _.each(
            this.commonSearchModel.searchResults,
            function (value, key, results) {
              if (key !== 'timestamp') {
                delete this.commonSearchModel.searchResults[key];
              }
            },
            this
          );
          _.each(
            response,
            function (value, key, response) {
              if (key !== 'timestamp') {
                this.commonSearchModel.searchResults[key] = value;
              }
            },
            this
          );
          this.commonSearchModel.searchResults.timestamp(response.timestamp);
          this.total(response.total_results);
          this.hits(response.results.hits.hits.length);

          for (const enforcement of enforcements) {
            enforcement.tiles = (
              await $.getJSON(
                arches.urls.resource_tiles.replace(
                  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                  enforcement.resourceinstanceid
                )
              )
            ).tiles;
          }

          this.consultations(enforcements);
        },
        error: function (response, status, error) {},
        complete: function (request, status) {}
      });
    };

    this.getDescription = (consultation) => {
      const descriptionTile = consultation.tiles.find((tile) => {
        return tile.nodegroup === '89bf628e-b552-11ee-805b-0242ac120006';
      });
      const statusTile = consultation.tiles.find((tile) => {
        return tile.nodegroup === 'ac823b90-b555-11ee-805b-0242ac120006';
      });
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

    this.openFlagged = (resourceId) => {
      let url = arches.urls.plugin(
        `open-workflow?workflow-slug=respond-to-enforcement-workflow&resource-id=${resourceId}`
      );
      window.location.href = url;
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
