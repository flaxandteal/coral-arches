import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
import template from 'templates/views/components/workflows/show-nodes.htm';

function viewModel(params) {

    const self = this;
    self.resourceId = Object.values(params.tile.data)[0]()[0]["resourceId"];
    self.title = params.title;
    self.showNodes = ko.observable(params.showNodes.map(([label]) => [label, 'Loading…']));
    self.decodeHTML = (input) => {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    };

    self.getORMData = async() => {
        const aliases = params.showNodes.map(([, alias]) => alias);
        try {
            const ormResources = await $.ajax({
                type: 'POST',
                url: '/orm/resources',
                dataType: 'json',
                data: {
                    show_nodes : aliases,
                    resourceid : self.resourceId
                }
            });
            self.showNodes(params.showNodes.map(([label, alias]) => {
                const values = ormResources[alias] || [];
                return [label, values.length ? self.decodeHTML(values.join(', ')) : 'None'];
            }));
        } catch (e) {
            self.showNodes(params.showNodes.map(([label]) => [label, 'Unavailable']));
        }
    };
    self.getORMData();
}

ko.components.register('show-nodes', {
    viewModel: viewModel,
    template: template
});

export default viewModel;
