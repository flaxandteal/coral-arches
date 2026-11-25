import $ from 'jquery';
import ko from 'knockout';
import template from 'templates/views/components/workflows/show-nodes.htm';

// Shows nodes of the Heritage Asset linked by the step's tile; `inputs` shows them as locked text boxes.
function viewModel(params) {

    const self = this;
    self.title = params.title;
    self.inputs = params.inputs;
    self.showNodes = ko.observable(params.showNodes.map(([label]) => [label, 'Loading…']));
    self.decodeHTML = (input) => {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    };

    self.getORMData = async(resourceId) => {
        const aliases = params.showNodes.map(([, alias]) => alias);
        try {
            const ormResources = await $.ajax({
                type: 'POST',
                url: '/orm/resources',
                dataType: 'json',
                data: {
                    show_nodes : aliases,
                    resourceid : resourceId
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

    // The step can swap in its saved tile after this renders, so follow the form's tile, not the one passed in.
    ko.computed(() => {
        const tile = params.form?.tile?.() ?? params.tile;
        const value = tile && ko.unwrap(Object.values(tile.data)[0]);
        const resourceId = ko.unwrap(value?.[0]?.resourceId);
        if (resourceId) {
            self.getORMData(resourceId);
        }
    });
}

ko.components.register('show-nodes', {
    viewModel: viewModel,
    template: template
});

export default viewModel;
