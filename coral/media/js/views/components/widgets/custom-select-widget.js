import ko from 'knockout';
import DomainWidgetViewModel from 'viewmodels/domain-widget';
import selectTemplate from 'templates/views/components/widgets/custom-select.htm';
import select2Query from 'bindings/select2-query';

/**
 * registers a select-widget component for use in forms
 * @function external:"ko.components".select-widget
 * @param {object} params
 * @param {boolean} params.value - the value being managed
 * @param {object} params.config -
 * @param {string} params.config.label - label to use alongside the select input
 * @param {string} params.config.placeholder - default text to show in the select input
 * @param {string} params.config.options -
 */

const viewModel = function(params) {
    params.configKeys = ['placeholder', 'defaultValue'];
    DomainWidgetViewModel.apply(this, [params]);        
    this.select2Config = {
        clickBubble: true,
        disabled: this.disabled,
        data: this.options,
        value: this.value,
        multiple: this.multiple,
        placeholder: this.placeholder,
        allowClear: true,
        minimumResultsForSearch: 2
    }
};

export default ko.components.register('custom-select-widget', {
        viewModel: viewModel,
        template: selectTemplate,
    });
