// define([
//     'underscore',
//     'jquery',
//     'arches',
//     'knockout',
//     'knockout-mapping',
//     'views/components/workflows/new-tile-step',
//     'templates/views/components/workflows/new-tile-step.htm',
// ], function(_, $, arches, ko, koMapping, NewTileStep, template) {

//     function viewModel(params) {

//         // get the template value from the tile from prev step, (done)
//         // make request to do the docx work and retrieve the file (done)
//         // -- file retrieval: name it with date (easy enough)
//         // -- and create a link to download it via the download btn
//         // -- upload new file to dropzone?
//         // populate file-list widget with existing other tile data?

//         if (!ko.unwrap(params.resourceid) && params.requirements){
//             params.resourceid(params.requirements.resourceid);
//             params.tileid(params.requirements.tileid);
//         }

//         NewTileStep.apply(this, [params]);
//         var this = this;
//         this.requirements = params.requirements;
//         params.tile = this.tile;

//         params.defineStateProperties = function(){
//                 return {
//                     resourceid: ko.unwrap(params.resourceid),
//                     tile: !!(params.tile) ? koMapping.toJS(params.tile().data) : undefined,
//                     tileid: !!(params.tile) ? ko.unwrap(params.tile().tileid): undefined
//                 }
//             };

//         this.tile.subscribe(function(val) {
//             if(val) {
//                 if(this.requirements) {
//                     if (this.requirements.applyOutputToTarget) {
//                         val.data[this.requirements.targetnode](this.requirements.value);
//                     }
//                 }
//             }
//         });
//         console.log(this, params);

//         this.retrieveFile = function() {
//             var tiles = params.requirements.tiles;
//             var letterTypeNodeId = "8d41e4df-a250-11e9-af01-00224800b26d";
//             var templateId = false;

//             tiles.forEach(function(tile){
//                 if (ko.unwrap(tile["data"][letterTypeNodeId])) { templateId = tile["data"][letterTypeNodeId](); }
//             });
//             if(templateId) {
//                 $.ajax({
//                     type: "GET",
//                     url: arches.urls.root + 'filetemplate',
//                     data: {
//                         "resourceinstance_id": params.resourceid(),
//                         "template_id": templateId
//                     },
//                     context: this,
//                     success: function(responseText, status, response){
//                         console.log(response.responseJSON);
//                     },
//                     error: function(response, status, error) {
//                         console.log(response);
//                         if(response.statusText !== 'abort'){
//                             this.viewModel.alert(new AlertViewModel('ep-alert-red', arches.requestFailed.title, response.responseText));
//                         }
//                     }
//                 });
//             }
//             this.loading(false);
//         };
//     };

//     return ko.components.register('file-template', {
//         viewModel: viewModel,
//         template: template
//     });
//     return viewModel;
// });

define([
  'underscore',
  'jquery',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/file-template.htm'
], function (_, $, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    console.log('params: ', params);
    console.log('this: ', this);

    this.LETTER_TYPE_NODE = '49c6587a-f5af-11ee-9f07-0242ac170006';
    this.digitalResourceNameNodegroupId = 'c61ab163-9513-11ea-9bb6-f875a44e0e11';
    this.digitalResourceNameNodeId = 'c61ab16c-9513-11ea-89a4-f875a44e0e11';

    this.selectedLetterType = ko.observable();
    this.uploadedFiles = ko.observableArray();

    this.tile.data[this.LETTER_TYPE_NODE].subscribe((value) => {
      console.log('type changed: ', value);
      this.selectedLetterType(value);
    }, this);

    this.retrieveFile = async () => {
      // this.loading(true);
      if (this.selectedLetterType()) {
        await $.ajax({
          type: 'POST',
          url: arches.urls.root + 'filetemplate',
          data: JSON.stringify({
            resourceinstance_id: params.resourceid,
            template_id: this.selectedLetterType()
          }),
          context: this,
          success: async (responseText, status, response) => {
            console.log(response.responseJSON);
            await this.saveDigitalResourceName(
              response.responseJSON.tile.data['96f8830a-8490-11ea-9aba-f875a44e0e11'][0].name,
              response.responseJSON.tile.resourceinstance_id
            );
            await this.saveRelationship(response.responseJSON.tile.resourceinstance_id);
          },
          error: (response, status, error) => {
            console.log(response);
            if (response.statusText !== 'abort') {
              this.viewModel.alert(
                new AlertViewModel(
                  'ep-alert-red',
                  arches.requestFailed.title,
                  response.responseText
                )
              );
            }
          }
        });
      }
      // this.loading(false);
    };

    this.saveDigitalResourceName = async (name, resourceId) => {
      const nameTemplate = {
        tileid: '',
        data: {
          'c61ab166-9513-11ea-a44c-f875a44e0e11': null,
          'c61ab167-9513-11ea-9d50-f875a44e0e11': null,
          'c61ab168-9513-11ea-9980-f875a44e0e11': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
          'c61ab169-9513-11ea-b7c1-f875a44e0e11': '8a96a261-cd79-48e2-9f12-74924c152b00',
          'c61ab16a-9513-11ea-9afb-f875a44e0e11': 'a0e096e2-f5ae-4579-950d-3040714713b4',
          'c61ab16b-9513-11ea-ab9d-f875a44e0e11': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
          'c61ab16c-9513-11ea-89a4-f875a44e0e11': null
        },
        nodegroup_id: this.digitalResourceNameNodegroupId,
        parenttile_id: null,
        resourceinstance_id: resourceId,
        sortorder: 0
      };

      //   const resource = await window.fetch(
      //     arches.urls.api_resources(ko.unwrap(this.resourceModelId)) + '?format=json'
      //   );
      //   if (resource?.ok) {
      // const resourceData = await resource.json();
      nameTemplate.data[this.digitalResourceNameNodeId] = {
        en: {
          direction: 'ltr',
          value: name
        }
      };
      /**
       * Check if the tile has already been saved and has a tile id assigned.
       */
      // if (!this.digitalResourceNameTileId) {
      //   this.digitalResourceNameTileId = uuid.generate();
      // } else {
      //   nameTemplate.tileid = this.digitalResourceNameTileId;
      // }

      /**
       * Update or create  the tile with the information that was provided
       * when the save button was clicked.
       */
      const nameTile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(nameTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      /**
       * If the tile was successfully created get the tile the id it was assigned
       * and the resourceinstance_id. Taking the ri_id will allow it to be used
       * to create the relationship.
       */
      if (nameTile?.ok) {
        const nameTileResult = await nameTile.json();
        //   this.digitalResourceNameTileId = nameTileResult.tileid;
        //   this.resourceId(nameTileResult.resourceinstance_id);
        return nameTile;
      }
      //   }
    };

    this.saveRelationship = async (resourceId) => {
      console.log('this.tile[data]: ', this.tile['data']);
      console.log('this.tile[data]: ', ko.toJS(this.tile['data']));
      this.tile.data['49c6587a-f5af-11ee-9f07-0242ac170006'] = this.selectedLetterType();
      this.tile.data['49c65b86-f5af-11ee-9f07-0242ac170006'] =
        '956f9779-3524-448e-b2de-eabf2de95d51';
      this.tile.data['49c65ece-f5af-11ee-9f07-0242ac170006'] = [
        {
          resourceId: resourceId,
          ontologyProperty: '',
          inverseOntologyProperty: ''
        }
      ];
      this.tile.tileid = uuid.generate();
      const fileTileTemplate = {
        tileid: '',
        data: {
          '49c6587a-f5af-11ee-9f07-0242ac170006': this.selectedLetterType(),
          '49c65b86-f5af-11ee-9f07-0242ac170006': '956f9779-3524-448e-b2de-eabf2de95d51',
          '49c65ece-f5af-11ee-9f07-0242ac170006': [
            {
              resourceId: resourceId,
              ontologyProperty: '',
              inverseOntologyProperty: ''
            }
          ]
        },
        nodegroup_id: '49c65316-f5af-11ee-9f07-0242ac170006',
        parenttile_id: null,
        resourceinstance_id: params.resourceid,
        sortorder: 0
      };

      console.log('fileTileTemplate: ', this.tile);

      /**
       * Similar to the name tile this will generate or use the previous
       * tile id that was saved.
       */
      // if (!this.digitalFileNodeTileId) {
      // this.digitalFileNodeTileId = uuid.generate();
      // } else {
      //   fileTileTemplate.tileid = this.digitalFileNodeTileId;
      // }

      const fileTile = await window.fetch(arches.urls.api_tiles(this.tile.tileid), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(fileTileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (fileTile?.ok) {
        await this.form.saveMultiTiles();
        // const fileTileResult = await fileTile.json();
        // this.form.tiles.append()
        // // this.digitalFileNodeTileId = fileTileResult.tileid;
        // return fileTile;
      }
    };

    params.form.save = () => {};

    // params.form.save = async () => {
    //   await this.tile.save();
    //   await this.retrieveFile();
    //   params.form.savedData({
    //     tileData: koMapping.toJSON(this.tile.data),
    //     tileId: this.tile.tileid,
    //     resourceInstanceId: this.tile.resourceinstance_id,
    //     nodegroupId: this.tile.nodegroup_id
    //   });
    //   params.form.complete(true);
    //   params.form.saving(false);
    // };

    this.getFileTiles = async (resourceId) => {
      console.log('run');

      let fileTiles = [];

      await Promise.all(
        this.form.tiles().map((tile) => {
          console.log('1 tile: ', tile);
          const digitalObjectResourceId = ko.toJS(tile.data)[
            '49c65ece-f5af-11ee-9f07-0242ac170006'
          ][0].resourceId;
          if (!digitalObjectResourceId) return;
          console.log('digitalObjectResourceId: ', digitalObjectResourceId);
          return $.ajax({
            type: 'GET',
            url:
              arches.urls.root +
              `resource/${digitalObjectResourceId}/tiles?nodeid=96f8830a-8490-11ea-9aba-f875a44e0e11`,
            context: this,
            success: async (responseText, status, response) => {
              console.log(response.responseJSON);
              const fileObj =
                response.responseJSON.tiles[0].data['96f8830a-8490-11ea-9aba-f875a44e0e11'][0];
              fileTiles.push({
                tileId: response.responseJSON.tiles[0].tileid,
                url: fileObj.url,
                name: fileObj.name
              });
            },
            error: (response, status, error) => {
              console.log(response);
              if (response.statusText !== 'abort') {
                this.viewModel.alert(
                  new AlertViewModel(
                    'ep-alert-red',
                    arches.requestFailed.title,
                    response.responseText
                  )
                );
              }
            }
          });
        })
      );

      this.uploadedFiles(fileTiles);
      this.uploadedFiles.valueHasMutated();

      console.log('this.uploadedFiles: ', this.uploadedFiles());
    };

    this.getFileTiles();

    this.downloadFile = (url, name) => {
      var link = document.createElement('a');
      link.href = url;
      link.download = name; // Extracting file name from path
      link.click();
    };

    this.form.saveMultiTiles = async () => {
      /**
       * TAKEN FROM DEFAULT-CARD-UTIL AND MODIFIED
       */
      this.form.addOrUpdateTile();
      await this.getFileTiles();

      // this.form.complete(false);
      // this.form.saving(true);
      this.previouslyPersistedComponentData = [];

      /**
       * Original version of this method that has been
       * overridden here didn't end the save if there
       * wasn't any tiles saved. Multi tile steps can
       * now progress if no data was provided.
       */
      if (this.tiles().length === 0 && this.tilesToRemove().length === 0) {
        // this.form.complete(true);
        // this.form.loading(true);
        // this.form.saving(false);

        return;
      }

      const unorderedSavedData = ko.observableArray();

      // '49c6587a-f5af-11ee-9f07-0242ac170006': this.selectedLetterType(),
      //     '49c65b86-f5af-11ee-9f07-0242ac170006': '956f9779-3524-448e-b2de-eabf2de95d51',
      //     '49c65ece-f5af-11ee-9f07-0242ac170006': [
      //       {
      //         resourceId: resourceId,
      //         ontologyProperty: '',
      //         inverseOntologyProperty: ''
      //       }
      //     ]

      /**
       * Never actually run the save.
       */
      this.form.tiles().forEach((tile) => {
        console.log('tile: ', tile);
        console.log('tile: ', ko.toJS(tile.data));
        unorderedSavedData.push({
          data: ko.toJS(tile.data),
          tileid: tile.tileid,
          nodegroup_id: tile.nodegroup_id,
          parenttile_id: null,
          provisionaledits: null,
          resourceinstance_id: tile.resourceinstance_id,
          sortorder: 0,
          tiles: []
        });
        // tile.save(
        //   () => {
        //     /* onFail */
        //   },
        //   (savedTileData) => {
        //     unorderedSavedData.push(savedTileData);
        //   }
        // );
      });

      this.form.tilesToRemove().forEach((tile) => {
        tile.deleteTile(
          (response) => {
            this.form.alert(
              new AlertViewModel(
                'ep-alert-red',
                response.responseJSON.title,
                response.responseJSON.message,
                null,
                () => {
                  return;
                }
              )
            );
          },
          () => {
            this.form.tilesToRemove.remove(tile);
            /**
             * This functionality wasn't needed
             */
            // if (this.tilesToRemove().length === 0) {
            //   //   this.complete(true);
            //   //   this.loading(true);
            //   //   this.saving(false);
            // }
          }
        );
      });

      if (!this.form.tiles().length) {
        // this.form.complete(true);
        // this.form.loading(true);
        // this.form.saving(false);
        this.form.savedData([]);
      }

      // const saveSubscription = unorderedSavedData.subscribe((savedData) => {
      if (this.form.tiles().length) {
        // this.form.complete(true);
        // this.form.loading(true);
        // this.form.saving(false);

        const orderedSavedData = this.form.tiles().map((tile) => {
          return unorderedSavedData().find((datum) => {
            return datum.tileid === tile.tileid;
          });
        });

        this.form.savedData(orderedSavedData.reverse());

        // saveSubscription.dispose(); /* this-disposing subscription only runs once */
      }
      // });

      setTimeout(() => console.log(this.form.savedData()));
    };
  }

  ko.components.register('file-template', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
