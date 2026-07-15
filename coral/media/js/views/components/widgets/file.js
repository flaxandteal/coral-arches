import $ from 'jquery';
import ko from 'knockout';
import _ from 'underscore';
import Dropzone from 'dropzone';
import uuid from 'uuid';
import FileWidgetViewModel from 'viewmodels/file-widget';
import fileWidgetTemplate from 'templates/views/components/widgets/file.htm';
import dropzone from 'bindings/dropzone';

/**
 * registers a file-widget component for use in forms
 * @function external:"ko.components".file-widget
 * @param {object} params
 * @param {string} params.value - the value being managed
 * @param {function} params.config - observable containing config object
 * @param {string} params.config().acceptedFiles - accept attribute value for file input
 * @param {string} params.config().maxFilesize - maximum allowed file size in MB
 */

const viewModel = function(params) {
    params.configKeys = ['acceptedFiles', 'maxFilesize'];

    FileWidgetViewModel.apply(this, [params]);

    this.downloadFile = function(fileUrl, fileName) {
        const url = this.getFileUrl(fileUrl);
        if (!url) return true;
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = ko.unwrap(fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => console.error('Error downloading file:', error));
    };
};

export default ko.components.register('file-widget', {
        viewModel: viewModel,
        template: fileWidgetTemplate,
    });
