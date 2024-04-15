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

    /**
     * Matches structure of the Correspondence branch
     */
    this.LETTER_TYPE_NODE = params.letterTypeNode;
    this.LETTER_RESOURCE_NODE = params.letterResourceNode;
    this.LETTER_METATYPE = params.letterMetatype;

    this.DIGITAL_OBJECT_NAME_NODEGROUP = 'c61ab163-9513-11ea-9bb6-f875a44e0e11';
    this.DIGITAL_OBJECT_NAME_NODE = 'c61ab16c-9513-11ea-89a4-f875a44e0e11';
    this.DIGITAL_OBJECT_FILE_NODE = '96f8830a-8490-11ea-9aba-f875a44e0e11';
    this.DIGITAL_OBJECT_FILE_CONTENT_NODE = '7db68c6c-8490-11ea-a543-f875a44e0e11';

    this.selectedLetterType = ko.observable();
    this.uploadedFiles = ko.observableArray();

    this.tile.data[this.LETTER_TYPE_NODE].subscribe((value) => {
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
              response.responseJSON.tile.data[this.DIGITAL_OBJECT_FILE_NODE][0].name,
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
          [this.DIGITAL_OBJECT_NAME_NODE]: {
            en: {
              direction: 'ltr',
              value: name
            }
          }
        },
        nodegroup_id: this.DIGITAL_OBJECT_NAME_NODEGROUP,
        parenttile_id: null,
        resourceinstance_id: resourceId,
        sortorder: 0
      };

      const id = uuid.generate();

      await window.fetch(arches.urls.api_tiles(id), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(nameTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // TODO: Handle errors
    };

    this.saveRelationship = async (resourceId) => {
      const id = uuid.generate();

      this.tile.data[this.LETTER_TYPE_NODE] = this.selectedLetterType();
      this.tile.data[this.LETTER_METATYPE] = '956f9779-3524-448e-b2de-eabf2de95d51';
      this.tile.data[this.LETTER_RESOURCE_NODE] = [
        {
          resourceId: resourceId,
          ontologyProperty: '',
          inverseOntologyProperty: ''
        }
      ];
      this.tile.tileid = id;

      const fileTileTemplate = {
        tileid: '',
        data: {
          [this.LETTER_TYPE_NODE]: this.selectedLetterType(),
          [this.LETTER_METATYPE]: '956f9779-3524-448e-b2de-eabf2de95d51',
          [this.LETTER_RESOURCE_NODE]: [
            {
              resourceId: resourceId,
              ontologyProperty: '',
              inverseOntologyProperty: ''
            }
          ]
        },
        nodegroup_id: params.nodegroupid,
        parenttile_id: null,
        resourceinstance_id: params.resourceid,
        sortorder: 0
      };

      const fileTile = await window.fetch(arches.urls.api_tiles(id), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(fileTileTemplate),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // TODO: Handle errors
      if (fileTile?.ok) {
        const fileTileResult = await fileTile.json();
        await this.form.saveMultiTiles(fileTileResult.tileid);
      }
    };

    /**
     * Override default save
     */
    params.form.save = () => {};

    this.getFileTiles = async (resourceId) => {
      const fileTiles = [];

      await Promise.all(
        this.form.tiles().map((tile) => {
          const digitalObjectResourceId = ko.toJS(tile.data)[this.LETTER_RESOURCE_NODE][0]
            .resourceId;
          if (!digitalObjectResourceId) return;
          return $.ajax({
            type: 'GET',
            url:
              arches.urls.root +
              `resource/${digitalObjectResourceId}/tiles?nodeid=${this.DIGITAL_OBJECT_FILE_CONTENT_NODE}`,
            context: this,
            success: async (responseText, status, response) => {
              console.log(response.responseJSON);
              const fileObj = response.responseJSON.tiles[0].data[this.DIGITAL_OBJECT_FILE_NODE][0];
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
    };

    this.getFileTiles();

    this.downloadFile = (url, name) => {
      var link = document.createElement('a');
      link.href = url;
      link.download = name; // Extracting file name from path
      link.click();
    };

    this.form.saveMultiTiles = async (newTileId) => {
      if (!newTileId) return;

      this.form.addOrUpdateTile();
      await this.getFileTiles();

      this.previouslyPersistedComponentData = [];

      if (this.tiles().length === 0 && this.tilesToRemove().length === 0) {
        // this.form.complete(true);
        // this.form.loading(true);
        // this.form.saving(false);

        return;
      }

      const unorderedSavedData = ko.observableArray();

      this.form.tiles().forEach((tile) => {
        if (!tile.tileid) tile.tileid = newTileId;
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
      });

      if (!this.form.tiles().length) {
        // this.form.complete(true);
        // this.form.loading(true);
        // this.form.saving(false);
        this.form.savedData([]);
      }

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
      }
    };
  }

  ko.components.register('file-template', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
