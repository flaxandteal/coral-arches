import ReferenceSelectViewModel from 'arches_controlled_lists/arches_controlled_lists/media/js/viewmodels/reference-select';

export default function (params) {
    ReferenceSelectViewModel.call(this, params);

    const ajax = this.select2Config.ajax;
    const data = ajax.data;
    const processResults = ajax.processResults;

    ajax.data = function (requestParams) {
        return Object.assign(data(requestParams), { page: requestParams.page || 1 });
    };
    ajax.processResults = function (response, requestParams) {
        const results = processResults(response, requestParams);
        results.pagination = { more: !!response.more };
        return results;
    };
}
