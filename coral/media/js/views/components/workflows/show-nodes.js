define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'viewmodels/alert',
    'templates/views/components/workflows/show-nodes.htm'
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
    function viewModel(params) {
        console.log("I'm trying to show nodes")
        console.log(params)
        console.log(params.showNodes)
        console.log("Yo bro", Object.values(params.tile.data)[0]())
        console.log("Yo bro", Object.values(params.tile.data)[0]()[0]["resourceId"])
        resourceId = Object.values(params.tile.data)[0]()[0]["resourceId"]

        showNodes = ko.observable(params.showNodes)
        decodeHTML = (input) => {
            var doc = new DOMParser().parseFromString(input, "text/html");
            return doc.documentElement.textContent;
        }

        getORMData = async () => {
            const ormResources = await $.ajax({
                type: 'POST',
                url: '/orm/resources',
                dataType: 'json',
                data: {
                    show_nodes : params.showNodes.map(sn => sn[1]),
                    graphid : "076f9381-7b00-11e9-8d6b-80000b44d1d9",
                    resourceid : resourceId
                },
                context: this
            });
            displayNodes = []
            showNodes().forEach(labelValue => {
              console.log()
              displayNodes.push([labelValue[0], decodeHTML(ormResources[labelValue[1]])])
            })
            showNodes(displayNodes)

        }
        getORMData()
    }
  
    ko.components.register('show-nodes', {
      viewModel: viewModel,
      template: template
    });
  
    return viewModel;
  });
  