import $ from 'jquery';
import ko from 'knockout';
import moment from 'moment';

// Run after `datepicker`: typing over today's date, filled in on open, replaces it
// instead of appending to it, and a typed date past maxDate becomes maxDate.
ko.bindingHandlers.datepickerClamp = {
    init: function (element) {
        var picker = $(element).data('DateTimePicker');
        var filledOnOpen = null;
        $(element).on('dp.show', function () {
            var today = moment().format(picker.format());
            filledOnOpen = element.value === today ? today : null;
        });
        $(element).on('keydown', function (event) {
            if (filledOnOpen && element.value === filledOnOpen && event.key.length === 1) {
                element.select();
            }
            filledOnOpen = null;
        });
        $(element).on('dp.error', function (event) {
            var max = picker.maxDate();
            if (max && event.date && event.date.isAfter(max)) {
                picker.date(max);
            }
        });
    }
};

export default ko.bindingHandlers.datepickerClamp;
