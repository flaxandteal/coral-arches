// define([
//   'underscore',
//   'knockout',
//   'knockout-mapping',
//   'uuid',
//   'arches',
//   'viewmodels/card-component',
//   'viewmodels/alert',
//   'templates/views/components/workflows/agriculture-and-forestry-consultation-workflow/get-selected-heritage-asset-details.htm'
// ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
//   function viewModel(params) {
//     CardComponentViewModel.apply(this, [params]);
//     this.SYSTEM_REFERENCE_NODEGROUP = '325a2f2f-efe4-11eb-9b0c-a87eeabdefba';
//     this.SYSTEM_REFERENCE_RESOURCE_ID_NODE = '325a430a-efe4-11eb-810b-a87eeabdefba';

//     this.HERRITAGE_ASSET_REFERENCES_NODEGROUP = 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
//     this.SMR_NUMBER_NODE = '158e1ed2-3aae-11ef-a2d0-0242ac120003';

//     this.DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba';
//     this.DESIGNATIONS_TYPE_NODE = '6af2a0ce-efc5-11eb-88d1-a87eeabdefba';

//     this.MONUMENT_NAMES_NODEGROUP = '676d47f9-9c1c-11ea-9aa0-f875a44e0e11';
//     this.MONUMENT_NAMES_NODE = '676d47ff-9c1c-11ea-b07f-f875a44e0e11';

//     this.CM_REFERENCE_NODEGROUP = '3d415e98-d23b-11ee-9373-0242ac180006';
//     this.CM_REFERENCE_NODE = '3d419020-d23b-11ee-9373-0242ac180006';

//     this.ADDRESSES_NODEGROUP = '87d39b25-f44f-11eb-95e5-a87eeabdefba'
//     this.TOWNLAND_NODEGROUP = '919bcb94-345c-11ef-a5b7-0242ac120003';
//     this.TOWNLAND_NODE = 'd033683a-345c-11ef-a5b7-0242ac120003';

//     this.labels = params.labels || [];

//     this.selectedHeritages = ko.observable([]);

//     this.cards = ko.observable({})

//     const self = this

//     console.log("Resource ID ", params.resourceId);

//     this.form
//       .card()
//       ?.widgets()
//       .forEach((widget) => {
//         this.labels?.forEach(([prevLabel, newLabel]) => {
//           if (widget.label() === prevLabel) {
//             widget.label(newLabel);
//           }
//         });
//       });

//     console.log("tile data ", this.tile.data['58a2b98f-a255-11e9-9a30-00224800b26d']);

//     this.tile.data['58a2b98f-a255-11e9-9a30-00224800b26d'].subscribe((value) => {
//       if (value && value.length) {
//         currentResources = value.map(t => ko.unwrap(t.resourceId))
//         currentResources.forEach(id => {
//           this.cards({...this.cards(), [id] : {
//             smrNumber : "",
//             county : "",
//             townlands : "",
//             heritageAssetType : "",
//             recordsNI : ""
//           }})
//           this.getHeritageDetails(id);
//         })
//         this.selectedHeritages(currentResources);
//       } else {
//         this.selectedHeritages([])
//       }
//     }, this);

//     this.fetchTileData = async (resourceId) => {
//       const tilesResponse = await window.fetch(
//         arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
//       );
//       const data = await tilesResponse.json();


//       console.log("Data tiles", data.tiles);
//       return data.tiles;
//     };

//     this.getHeritageDetails = async (resourceId) => {
//       const tiles = await this.fetchTileData(resourceId);
//       const smrNumber = ko.observable();
//       const County = ko.observable();
//       const Townlands = ko.observable();
//       const HeritageAssetType = ko.observable();
//       const RecordsNI = ko.observable();
  
//       const additionalPromises = []

//       for (const tile of tiles) {
//         if (tile.nodegroup === this.HERRITAGE_ASSET_REFERENCES_NODEGROUP) {
//           smrNumber(tile.data[this.SMR_NUMBER_NODE].en.value);
//         }

//         if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
//           monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
//         }

//         if (tile.nodegroup === this.CM_REFERENCE_NODEGROUP) {
//           cmNumber(tile.data[this.CM_REFERENCE_NODE].en.value);
//         }

//         if (tile.nodegroup === this.DESIGNATIONS_NODEGROUP) {
//           const typeId = tile.data[this.DESIGNATIONS_TYPE_NODE];
//           additionalPromises.push(await $.ajax({
//             type: 'GET',
//             url: arches.urls.concept_value + `?valueid=${typeId}`,
//             context: self,
//             success: function (responseJSON, status, response) {
//               designationType(responseJSON.value);
//             },
//             error: function (response, status, error) {
//               if (response.statusText !== 'abort') {
//                 this.viewModel.alert(
//                   new AlertViewModel(
//                     'ep-alert-red',
//                     arches.requestFailed.title,
//                     response.responseText
//                   )
//                 );
//               }
//             }
//           }))
//         }

//         if (tile.nodegroup === this.ADDRESSES_NODEGROUP) {
//           const typeId = tile.data[this.TOWNLAND_NODE];
//           additionalPromises.push(await $.ajax({
//             type: 'GET',
//             url: arches.urls.concept_value + `?valueid=${typeId}`,
//             context: self,
//             success: function (responseJSON, status, response) {
//               Townlands(responseJSON.value);
//             },
//             error: function (response, status, error) {
//               if (response.statusText !== 'abort') {
//                 this.viewModel.alert(
//                   new AlertViewModel(
//                     'ep-alert-red',
//                     arches.requestFailed.title,
//                     response.responseText
//                   )
//                 );
//               }
//             }
//           }))
//         }
//       }
//         await Promise.all(additionalPromises)
//         .then((p) => {
//           //
//         })
//         .catch(p => {
//           //
//         })
//         .finally(() => {
//           this.cards({...this.cards(), [resourceId]: {
//             smrNumber : smrNumber(),
//             county : County(),
//             townlands : Townlands(),
//             heritageAssetType : HeritageAssetType(),
//             recordsNI : RecordsNI()
//           }})
//         })
//     };
//     if (this.tile.data['58a2b98f-a255-11e9-9a30-00224800b26d']())  {
//       const preFilled = this.tile.data['58a2b98f-a255-11e9-9a30-00224800b26d']().map(t => t.resourceId)
//       preFilled.forEach(id => {
//         this.cards()[id] = {
//           smrNumber : "",
//           county : "",
//           townlands : "",
//           heritageAssetType : "",
//           recordsNI : ""
//         }
//         this.getMonumentDetails(id);
//       })
//       this.selectedMonuments(preFilled);
//     }
//   }

//   ko.components.register('get-selected-heritage-asset-details', {
//     viewModel: viewModel,
//     template: template
//   });

//   return viewModel;
// });
