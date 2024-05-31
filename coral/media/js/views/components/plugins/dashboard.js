define([
    'jquery',
    'knockout',
    'underscore',
    'knockout-mapping',
    'arches',
    'templates/views/components/plugins/dashboard.htm',
  ], function ($, ko, _, koMapping, arches, pageTemplate,) {

    const pageViewModel = function (params) {

        this.resources = ko.observableArray([]);
        this.counters = ko.observableArray([]);
        this.total = ko.observable();
        this.itemsPerPage = ko.observable(10);
        this.currentPage = ko.observable(1);
        this.sortBy = ko.observable('deadline');
        this.sortOrder = ko.observable('asc');
        this.sortOptions = ko.observableArray([]);
        this.loading = ko.observable(true);

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

        function debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
              const later = () => {
                  clearTimeout(timeout);
                  func(...args);
              };
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
          };
        };

        //convert titles for the counters to capitalise
        function formatCounters(key) {
          return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }

        //this converts a nested object to make it iterable in ko
        function convertToObservableArray(obj) {
          return ko.observableArray(Object.keys(obj).map(function(key) {
              return {key: formatCounters(key), value: ko.observableArray(Object.entries(obj[key]).map(([k, v]) => ({key: k, value: v})))};
          }));
        }

        const getTasks = async () => {
          try {
            const baseUrl = `${arches.urls.root}dashboard/resources`;
            const params = new URLSearchParams({
                page: this.currentPage(),
                itemsPerPage: this.itemsPerPage(),
                sortBy: this.sortBy(),
                sortOrder: this.sortOrder()
            });
    
            const response = await window.fetch(`${baseUrl}?${params}`);
            const data = await response.json()

            if(!response.ok) {
              this.loading(false);
              throw new Error(`HTTP error! status: ${data.error}`)
            }

            koMapping.fromJS(data.paginator, this.paginator)
            this.resources(data.paginator.response)
            this.total(data.paginator.total)
            this.counters(convertToObservableArray(data.paginator.counters))
            this.sortOptions(data.paginator.sort_options)
            this.loading(false)
          } catch (error) {
            console.error(error)
            return
          }
        } 

        this.openFlagged = (resourceId, responseSlug) => {
            let url = arches.urls.plugin(
              `${responseSlug}?resource-id=${resourceId}&workflow-id=6aaa72fa-ad6c-4350-bb90-ee32d034797a&workflow-step-id=7f259b0e-6ed6-484d-9d13-1381976cee9a`
            );
            window.location.href = url;
        };

        //reduces the number of items per page based on the window width
        const updateItemsPerPage = () => {
          if (window.innerWidth < 1000){
              this.itemsPerPage(2);
          }
          else if (window.innerWidth < 1400){
              this.itemsPerPage(4);
          }
          else if (window.innerWidth < 1800){
              this.itemsPerPage(6);
          } else {
              this.itemsPerPage(8);
          }
        }

        this.sortBy.subscribe(async () => {
          if (this.sortBy()) {
            getTasks();
          }
        });

        this.sortOrder.subscribe(async () => {
          if (this.sortOrder()) {
            getTasks();
          }
        });

        window.addEventListener('resize', debounce(async () => {
            const prevItemsPerPage = this.itemsPerPage();
            updateItemsPerPage(this);
            if (prevItemsPerPage === this.itemsPerPage()){
              return
            }
            await getTasks();
        }, 500));

        this.newPage = async (pageNumber) => {
            this.currentPage(pageNumber);
            await getTasks();
        };

        this.init = async () => {
            updateItemsPerPage();
            await getTasks();  
        }

        this.init();
    }

    return ko.components.register('dashboard', {
      viewModel: pageViewModel,
      template: pageTemplate
    });
  });
  