define([
    'underscore',
    'knockout',
    'arches',
    'utils/report',
    'templates/views/components/reports/scenes/django-group.htm',
    'bindings/datatable',
    'views/components/reports/scenes/keyvalue'
], function(_, ko, arches, reportUtils, djangoGroupReportTemplate) {
    return ko.components.register('views/components/reports/scenes/django-group', {
        viewModel: function(params) {
            const self = this;
            Object.assign(self, reportUtils);

            self.djangoGroupTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(2).fill(null)
            };

            self.dataConfig = {
                djangoGroup: 'django group',
            };

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.djangoGroup = ko.observable();
            self.visible = {
                djangoGroup: ko.observable(true),
            };
            Object.assign(self.dataConfig, params.dataConfig || {});

            const djangoGroupNode = self.getRawNodeValue(params.data(), self.dataConfig.djangoGroup);

            if(djangoGroupNode){
                console.log("DJANGO GROUP", djangoGroupNode);
                self.djangoGroup({
                    djangoGroupId: djangoGroupNode['djangoGroupId'],
                    displayValue: djangoGroupNode['@display_value'],
                    tileid: self.getTileId(djangoGroupNode)
                });
                console.log(self.djangoGroup());
            }

            if(params.dataConfig.djangoGroupSignupLink){
                params.dataConfig.djangoGroupSignupLink().done((link) => {
                    console.log("Link", link);
                    self.djangoGroupSignupLink(link.djangoGroupSignupLink);
                });
            }

        },
        template: djangoGroupReportTemplate
    });
});
