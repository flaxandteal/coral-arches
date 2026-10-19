import $ from 'jquery';
import ko from 'knockout';

// Run after `datepicker`: stops focus stamping today, and turns a typed date past maxDate into maxDate.
ko.bindingHandlers.datepickerClamp = {
    init: function (element) {
        var picker = $(element).data('DateTimePicker');
        picker.useCurrent(false);
        $(element).on('dp.error', function (event) {
            var max = picker.maxDate();
            if (max && event.date && event.date.isAfter(max)) {
                picker.date(max);
            }
        });
    }
};

export default ko.bindingHandlers.datepickerClamp;
