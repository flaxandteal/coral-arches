define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/excavation-area-select.htm',
], function(_, ko, uuid, arches, AlertViewModel, excavationAreaSelectStepTemplate) {
    function viewModel(params) {
        var self = this;
        this.resValue = ko.observable().extend({ deferred: true });
        this.resourceid = ko.observable();
        const excavationNodegroupId = '2107a235-94fb-11ea-a449-f875a44e0e11';
    this.disableResourceSelection = ko.observable(false);
        this.loading = params.loading;
        this.graphid = params.graphid;
        console.log("The params", params)
        self.area = {};
        var getValue = function(key) {
            return ko.unwrap(params.value) ? params.value()[key] : null; 
        }
        // this.geometry = ko.observable(getValue('geometry'));
        // this.subject = ko.observable(getValue('subject'));
        // this.type = ko.observable(getValue('type'));
        this.tileid = ko.observable(getValue('tileid'));

        console.log("geom and tile: ", this.geometry, this.tileid)
        console.log(excavationNodegroupId)

        this.resValue.subscribe(function(val){
            const resourceid = Array.isArray(val) && val.length ? val[0].resourceId : val;
            self.resourceid(ko.unwrap(resourceid));
        }, this);

        self.setSelectedArea = async (val) => {
            const response = await fetch(`${arches.urls.api_resource_report(val)}?format=json`);
            area = await response.json()
            self.area = area.report_json
        };

        this.resourceid.subscribe(function(val){
            console.log("sub", val)
            self.setSelectedArea(val)
            if (val) {
                self.resValue([{
                    resourceId: ko.observable(val),
                    ontologyProperty: ko.observable(""),
                    inverseOntologyProperty: ko.observable(""),
                    resourceXresourceId: ""
                }]);
            }
        })

        this.resourceid(getValue('resourceid'));
        if (this.resourceid()){
            this.disableResourceSelection(true);
        }

        this.updatedValue = ko.pureComputed(function(){
            return {
                tileid: self.tileid(),
                addresses: self.area.Addresses,
                applicationAreaName: self.area['Application Area Names']['Application Area Name'],
                geometry: self.area.Geometry
            };
        });

        this.updatedValue.subscribe(function(val){
            if (self.resourceid()) {
                params.value(val);
            }
        })

        var excavationTileData = ko.pureComputed(function(){
            // These use nodeid's
            console.log("excavation tile")
            return {
                "fdb2403c-fd46-46cf-993e-fb8480ffbefd": this.updatedValue.applicationAreaName, // Related Application Area node
                "927b24c5-42f4-419e-9e93-23de026e6776": this.updatedValue.geometry['Geospatial Coordinates'], // co-ordinates
                // "3ff7039a-6716-43cd-acc9-9fc1e6ebfffb": ko.unwrap(self.geometry), // Geometry
                "10b84ab0-b26c-444c-b7e7-2eb71ff80514": ko.unwrap(self.featureShapeType),
                "8a049373-f05a-4d15-aae3-ac7a2c760f13": ko.unwrap(self.featureShape),
                "153787b7-309e-4c18-9032-29d6d872cb02": ko.unwrap(self.descriptions),
                "5dcae758-49a6-4cea-b36b-dce619a43de6": ko.unwrap(self.type),
                "1b626700-daa7-474d-9743-ad516f1d0eee": ko.unwrap(self.metaType),
                "f1d75502-eb3f-4e20-aac8-aa3441d50332": ko.unwrap(self.description),

            }
        });

        this.buildTile = function(tileDataObj, nodeGroupId, resourceid, tileid) {
            var res = {
                "tileid": tileid || "",
                "nodegroup_id": nodeGroupId,
                "parenttile_id": null,
                "resourceinstance_id": resourceid,
                "sortorder": 0,
                "tiles": {},
                "data": {},
                "transaction_id": params.form.workflowId
            };
            for (const key in tileDataObj){
                res.data[key] = tileDataObj[key];
            }
            return res;
        };

        this.saveTile = function(tileDataObj, nodeGroupId, resourceid, tileid) {
            var tile = self.buildTile(tileDataObj, nodeGroupId, resourceid, tileid);
            if (!tileid) {tileid = uuid.generate();}
            return window.fetch(arches.urls.api_tiles(tileid), {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(tile),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    response.json().then(result => {
                        params.form.error(new Error("Missing Required Value"));
                        params.pageVm.alert(new AlertViewModel('ep-alert-red', result.title, result.message));
                        return;
                    })
                }
            });
        };

        params.form.save = function() {
            self.saveTile(excavationTileData(), excavationNodegroupId, self.resourceid(), self.tileid())
                .then(function(data) {
                    if (data?.resourceinstance_id) {
                        self.resourceid(data.resourceinstance_id);
                        self.tileid(data.tileid);
                        self.disableResourceSelection(true);
                        params.form.complete(true);
                        params.form.savedData({
                            resourceid: self.resourceid(), ...self.updatedValue()
                        });
                    }
                })
        };
    }

    ko.components.register('excavation-area-select', {
        viewModel: viewModel,
        template: excavationAreaSelectStepTemplate
    });

    return viewModel;
});
