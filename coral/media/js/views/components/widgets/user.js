define([
    'knockout',
    'viewmodels/user',
    'templates/views/components/widgets/user.htm',
    'bindings/select2-query',
], function(ko, UserSelectViewModel, userSelectTemplate) {

    return ko.components.register('user', {
        viewModel: UserSelectViewModel,
        template: userSelectTemplate,
    });
});
