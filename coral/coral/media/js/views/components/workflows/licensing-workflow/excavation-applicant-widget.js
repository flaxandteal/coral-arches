// define([
//   'underscore',
//   'knockout',
//   'uuid',
//   'arches',
//   'viewmodels/alert',
//   'templates/views/components/workflows/licensing-workflow/excavation-applicant-widget.htm',
// ], function(_, ko, uuid, arches, AlertViewModel, excavationApplicantWidgetTemplate) {
//   function viewModel(params) {
//       var self = this;
//       this.resValue = ko.observable().extend({ deferred: true });
//       this.resourceid = ko.observable();
//       this.applicantNodegroupId = '6d290832-5891-11ee-a624-0242ac120004';
//       this.disableResourceSelection = ko.observable(false);
//       this.loading = params.loading;
//       this.graphid = params.graphid;
//       console.log("PARAM", params)
//     //   var getValue = function(key) {
//     //       return ko.unwrap(params.value) ? params.value()[key] : null;
//     //   }

//     //   this.resValue.subscribe(function(val){
//     //       const resourceid = Array.isArray(val) && val.length ? val[0].resourceId : val;
//     //       self.resourceid(ko.unwrap(resourceid));
//     //   }, this);

//     //   this.resourceid.subscribe(function(val){
//     //       if (val) {
//     //           self.resValue([{
//     //               resourceId: ko.observable(val),
//     //               ontologyProperty: ko.observable(""),
//     //               inverseOntologyProperty: ko.observable(""),
//     //               resourceXresourceId: ""
//     //           }]);
//     //       }
//     //   })

//     //   this.resourceid(getValue('resourceid'));
//     //   if (this.resourceid()){
//     //       this.disableResourceSelection(true);
//     //   }

//     //   this.updatedValue = ko.pureComputed(function(){
//     //       return {
//     //           tileid: self.tileid(),
//     //           date: self.date(),
//     //           subject: {
//     //               "en": {
//     //                   "direction": "ltr",
//     //                   "value": self.subject()
//     //               }
//     //           },
//     //           type: self.type(),
//     //           resourceid: self.resourceid()
//     //       };
//     //   });

//     //   this.updatedValue.subscribe(function(val){
//     //       if (self.resourceid()) {
//     //           params.value(val);
//     //       }
//     //   })

//     //   var communicationTileData = ko.pureComputed(function(){
//     //       return {
//     //       }
//     //   });

//     //   this.buildTile = function(tileDataObj, nodeGroupId, resourceid, tileid) {
//     //       var res = {
//     //           "tileid": tileid || "",
//     //           "nodegroup_id": nodeGroupId,
//     //           "parenttile_id": null,
//     //           "resourceinstance_id": resourceid,
//     //           "sortorder": 0,
//     //           "tiles": {},
//     //           "data": {},
//     //           "transaction_id": params.form.workflowId
//     //       };
//     //       for (const key in tileDataObj){
//     //           res.data[key] = tileDataObj[key];
//     //       }
//     //       return res;
//     //   };

//     //   this.saveTile = function(tileDataObj, nodeGroupId, resourceid, tileid) {
//     //       var tile = self.buildTile(tileDataObj, nodeGroupId, resourceid, tileid);
//     //       if (!tileid) {tileid = uuid.generate();}
//     //       return window.fetch(arches.urls.api_tiles(tileid), {
//     //           method: 'POST',
//     //           credentials: 'include',
//     //           body: JSON.stringify(tile),
//     //           headers: {
//     //               'Content-Type': 'application/json'
//     //           },
//     //       }).then(function(response) {
//     //           if (response.ok) {
//     //               return response.json();
//     //           } else {
//     //               response.json().then(result => {
//     //                   params.form.error(new Error("Missing Required Value"));
//     //                   params.pageVm.alert(new AlertViewModel('ep-alert-red', result.title, result.message));
//     //                   return;
//     //               })
//     //           }
//     //       });
//     //   };

//     //   params.form.save = function() {
//     //       self.saveTile(communicationTileData(), communicationNodegroupId, self.resourceid(), self.tileid())
//     //           .then(function(data) {
//     //               if (data?.resourceinstance_id) {
//     //                   self.resourceid(data.resourceinstance_id);
//     //                   self.tileid(data.tileid);
//     //                   self.disableResourceSelection(true);
//     //                   params.form.complete(true);
//     //                   params.form.savedData({
//     //                       resourceid: self.resourceid(), ...self.updatedValue()
//     //                   });
//     //               }
//     //           })
//     //   };
//   }

//   ko.components.register('excavation-applicant-widget', {
//       viewModel: viewModel,
//       template: excavationApplicantWidgetTemplate
//   });

//   return viewModel;
// });
