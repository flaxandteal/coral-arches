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

        const getTasks = async () => {
          try {
            const response = await window.fetch(`${arches.urls.root}dashboard/resources?page=${this.currentPage()}&itemsPerPage=${this.itemsPerPage()}`)
            const data = await response.json()

            if(!response.ok) {
              throw new Error(`HTTP error! status: ${data.error}`)
            }

            koMapping.fromJS(data.paginator, this.paginator)
            this.resources(data.paginator.response)
            this.total(data.paginator.total)
            this.counters(data.paginator.status_counts)
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
          else if (window.innerWidth < 1500){
              this.itemsPerPage(6);
          }
          else if (window.innerWidth < 1800){
              this.itemsPerPage(8);
          } else {
              this.itemsPerPage(10);
          }
        }

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
  