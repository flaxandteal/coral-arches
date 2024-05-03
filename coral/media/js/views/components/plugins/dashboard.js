define([
    'jquery',
    'knockout',
    'underscore',
    'knockout-mapping',
    'arches',
    'templates/views/components/plugins/dashboard.htm',
    'views/components/search/paging-filter'
  ], function ($, ko, _, koMapping, arches, pageTemplate) {

    const pageViewModel = function (params) {

        this.counters = ko.observableArray([
            { label: 'Total', count: ko.observable(0)},
            { label: 'New', count: ko.observable(0)},
            { label: 'In Progress', count: ko.observable(0)},
        ]);

        this.resources = ko.observableArray([
            {
                displayName: 'Enforcement',
                description: 'This is a description',
                status: 'In Progress',
                resourceId: 'resourceId1'
            },
            {
                displayName: 'Excavation',
                description: 'This is a description',
                status: 'In Progress',
                resourceId: 'resourceId2'
            },
            {
                displayName: 'Monument',
                description: 'This is a description',
                status: 'New',
                resourceId: 'resourceId3'
            },
            {
                displayName: 'License',
                description: 'This is a description',
                status: 'New',
                resourceId: 'resourceId4'
            },
        ])

        this.updateCounters = function() {
            this.counters().forEach(element => {
                switch(element.label) {
                    case 'Total':
                        element.count(this.resources().length);
                        break;
                    case 'New':
                        element.count(this.resources().filter(resource => resource.status === 'New').length);
                        break;
                    case 'In Progress':
                        element.count = (this.resources().filter(resource => resource.status === 'In Progress').length);
                        break;
                }
            });
        }

        this.updateCounters();
    }

    return ko.components.register('dashboard', {
      viewModel: pageViewModel,
      template: pageTemplate
    });
  });
  