define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'viewmodels/alert',
    'templates/views/components/workflows/show-nodes.htm'
], function(_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
    function viewModel(params) {

        const self = this;
        self.resourceId = Object.values(params.tile.data)[0]()[0]["resourceId"];
        self.title = params.title;
        console.log(params.title, self.title)
        self.showNodes = ko.observable(params.showNodes);
        self.decodeHTML = (input) => {
            var doc = new DOMParser().parseFromString(input, "text/html");
            return doc.documentElement.textContent;
        };

        self.getORMData = async() => {
            const ormResources = await $.ajax({
                type: 'POST',
                url: '/orm/resources',
                dataType: 'json',
                data: {
                    show_nodes : params.showNodes.map(sn => sn[1]),
                    graphid : "076f9381-7b00-11e9-8d6b-80000b44d1d9",
                    resourceid : self.resourceId
                },
                context: this
            });
            this.displayNodes = [];
            for (let [key, value] of Object.entries(ormResources)){
                if(value[0] === '['){
                    const concept = self.parseConcept(value);
                    ormResources[key] = concept.name;
                }
            }
            self.showNodes().forEach(labelValue => {
                console.log("here", labelValue);
                this.displayNodes.push([labelValue[0], self.decodeHTML(ormResources[labelValue[1]])]);
            });
            self.showNodes(this.displayNodes);

        };
        self.getORMData();

        self.parseConcept = (string) => {
            const regex = /^\[([^>]+)>([^[]+)\[([^\]]+)\]\]$/;
            const match = string.match(regex);
            if (match) {
                const concept = {
                    id: match[1],
                    conceptId: match[2],
                    name: match[3]
                };
                return concept;
            }
        };
    }
  
    ko.components.register('show-nodes', {
        viewModel: viewModel,
        template: template
    });
  
    return viewModel;
});
  