define([
    'underscore',
    'knockout',
    'arches',
    'utils/report',
    'templates/views/components/reports/scenes/user-account.htm',
    'bindings/datatable',
    'views/components/reports/scenes/keyvalue'
], function(_, ko, arches, reportUtils, userAccountReportTemplate) {
    return ko.components.register('views/components/reports/scenes/user-account', {
        viewModel: function(params) {
            const self = this;
            Object.assign(self, reportUtils);

            self.userAccountTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(2).fill(null)
            };

            self.dataConfig = {
                userAccount: 'user account',
                userSignupLink: 'user signup link'
            };

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.userAccount = ko.observable();
            self.userSignupLink = ko.observable(false);
            self.visible = {
                userAccount: ko.observable(true),
            };
            Object.assign(self.dataConfig, params.dataConfig || {});

            const userAccountNode = self.getRawNodeValue(params.data(), self.dataConfig.userAccount);

            if(userAccountNode){
                self.userAccount({
                    userId: userAccountNode['userId'],
                    displayValue: userAccountNode['@display_value'],
                    tileid: self.getTileId(userAccountNode)
                });
            }

            if(params.dataConfig.userSignupLink){
                params.dataConfig.userSignupLink().done((link) => {
                    self.userSignupLink(link.userSignupLink);
                });
            }

        },
        template: userAccountReportTemplate
    });
});
