define([
    'knockout', 
    'knockout-mapping',
    'underscore', 
    'viewmodels/widget', 
    'arches', 
    'templates/views/components/widgets/user.htm',
    'bindings/chosen'
], function(ko, koMapping, _, WidgetViewModel, arches, userWidgetTemplate) {
    /**
    * registers a text-widget component for use in forms
    * @function external:"ko.components".text-widget
    * @param {object} params
    * @param {string} params.value - the value being managed
    * @param {function} params.config - observable containing config object
    * @param {string} params.config().label - label to use alongside the text input
    * @param {string} params.config().placeholder - default text to show in the text input
    * @param {string} params.config().uneditable - disables widget
    */

    const viewModel = function(params) {
        params.configKeys = ['placeholder', 'width', 'maxLength', 'defaultValue', 'uneditable'];
         
        WidgetViewModel.apply(this, [params]);
        const self = this;

        self.card = params.card;
        self.currentText = ko.observable();

        self.currentDefaultText = ko.observable();

        const initialDefault = '';
        const initialCurrent = '';
        let currentDefaultValue = ko.unwrap(self.defaultValue) || initialDefault;
        let currentValue = koMapping.toJS(self.value);

        if(self.form){
            self.form.on('tile-reset', (x) => {
                currentValue = koMapping.toJS(self.value);
                self.currentText(currentValue);
            });
        }

        self.disable = ko.computed(() => {
            return ko.unwrap(self.disabled) || ko.unwrap(self.uneditable); 
        }, self);

        self.currentDefaultText.subscribe(newValue => {
            currentDefaultValue = newValue;
            self.defaultValue(currentDefaultValue);
            self.card._card.valueHasMutated();
        });

        self.currentText.subscribe(newValue => {
            currentValue = newValue;       
            self.value(currentValue);
        });

    };

    return ko.components.register('user', {
        viewModel: viewModel,
        template: userWidgetTemplate,
    });
});
