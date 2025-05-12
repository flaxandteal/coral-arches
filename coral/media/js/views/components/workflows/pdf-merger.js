define([
    'underscore',
    'jquery',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'viewmodels/alert',
    'templates/views/components/workflows/pdf-merger.htm',
    'docx-preview',
    'native-file-system-adapter'
], function(
    _,
    $,
    ko,
    koMapping,
    uuid,
    arches,
    CardComponentViewModel,
    AlertViewModel,
    template,
    docxPreview,
    NativeFileSystemAdapter
) {
    function viewModel(params) {
        CardComponentViewModel.apply(this, [params]);

        /**
     * Matches structure of the Correspondence branch
     */
        this.RESPONSE_FILES_NODE = "5d401df8-5989-11ef-9d18-0242ac120006";
        this.RESPONSE_FILE_TEAM_NODE = "983d73b0-5989-11ef-af2d-0242ac120006";

        this.RESPONSE_SUMMARY_NODE = "dd179870-cfe7-11ee-8a4e-0242ac180006";
        this.RESPONSE_SUMMARY_TEAM_NODE = "cd77b29c-2ef6-11ef-b1c4-0242ac140006";

        this.HMTEAM = "2628d62f-c206-4c06-b26a-3511e38ea243";
        this.HBTEAM = "70fddadb-8172-4029-b8fd-87f9101a3a2d";

        this.ACTION_TYPE_NODE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11";

        this.TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5';
        this.TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f';
        this.TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f';

        this.DIGITAL_OBJECT_NAME_NODEGROUP = 'c61ab163-9513-11ea-9bb6-f875a44e0e11';
        this.DIGITAL_OBJECT_NAME_NODE = 'c61ab16c-9513-11ea-89a4-f875a44e0e11';
        this.DIGITAL_OBJECT_FILE_NODE = '96f8830a-8490-11ea-9aba-f875a44e0e11';
        this.DIGITAL_OBJECT_FILE_CONTENT_NODE = '7db68c6c-8490-11ea-a543-f875a44e0e11';

        this.assignedTo = ko.observable();
        this.HMSummary = ko.observable(false);
        this.HBSummary = ko.observable(false);
        this.HMFiles = ko.observableArray([]);
        this.HBFiles = ko.observableArray([]);
        this.uploadedFiles = ko.observableArray();
        this.configKeys = ko.observable({ placeholder: 0 });
        this.letterOptions = ko.observable(params.letterOptions);

        this.disableGenerate = ko.computed(() => {
            const assigned = this.assignedTo();
            if (assigned === this.TYPE_ASSIGN_BOTH) {
                return !this.HMSummary() || !this.HBSummary();
            }
            if (assigned === this.TYPE_ASSIGN_HB) {
                return !this.HBSummary();
            }
            if (assigned === this.TYPE_ASSIGN_HM) {
                return !this.HMSummary();
            }
            return true;
        });

        this.fetchTileData = async(resourceId, nodeId) => {
            const tilesResponse = await window.fetch(
                arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
            );
            const data = await tilesResponse.json();
            return data.tiles;
        };

        this.fetchAssignedValue = async() => {
            const tile = await this.fetchTileData(params.resourceid, this.ACTION_TYPE_NODE);
            const responseTypeId = tile[0].data[this.ACTION_TYPE_NODE];
            return responseTypeId;
        };

        this.fetchResponseSummary = async() => {
            const tiles = await this.fetchTileData(params.resourceid, this.RESPONSE_SUMMARY_NODE);
            for(const tile of tiles){
                const summary = tile.data[this.RESPONSE_SUMMARY_NODE].en.value;
                const team = tile.data[this.RESPONSE_SUMMARY_TEAM_NODE];
                if(team === this.HMTEAM && summary?.trim() !== ""){
                    this.HMSummary(true);
                }
                if(team === this.HBTEAM && summary?.trim() !== ""){
                    this.HBSummary(true);
                }
            }
        };

        this.fetchRelatedFiles = async() => {
            const tilesResponse = await window.fetch(
                arches.urls.related_resources + params.resourceid
            );
            const data = await tilesResponse.json();
            return data.related_resources.related_resources;
        };

        this.getFileData = (resource, observable) => {
            let fileData = null;
            for (const tile of resource.tiles) {
                if (this.DIGITAL_OBJECT_FILE_NODE in tile.data) {
                    fileData = tile.data[this.DIGITAL_OBJECT_FILE_NODE];
                    break;
                }
            }
            for(const tile of fileData){
                const extension = tile.name.substring(tile.name.lastIndexOf('.') + 1);
                if (extension == 'pdf'){
                    const file = {
                        'blob': tile.content,
                        'url': tile.url,
                        'name': tile.name
                    };
                    observable.push(file);
                }
            }
        };

        this.checkUploadedFiles = async() => {
            const related = await this.fetchRelatedFiles();
            for(const r of related){
                if(r.displayname.includes("HB Response files")){
                    this.getFileData(r, this.HBFiles);
                }
                if(r.displayname.includes("HM Response files")){
                    this.getFileData(r, this.HMFiles);
                }
            }
        };
        

        this.fetchAssignedValue().then((value) => {
            this.assignedTo(value);
        });
        this.fetchResponseSummary();
        this.checkUploadedFiles();

        const getDisplayName = async() => {
            const resource = await window.fetch(
                arches.urls.api_resources(params.resourceid) + '?format=json'
            );
            const resourceData = await resource.json();
            return resourceData.displayname;
        };

        this.retrieveFile = async() => {
            // this.loading(true);
            
            await $.ajax({
                type: 'POST',
                url: arches.urls.root + 'filetemplate',
                data: JSON.stringify({
                    resourceinstance_id: params.resourceid,
                    template_id: 'planning-pdf-merger',
                    files: this.HMFiles().concat(this.HBFiles()),
                    config: params.config
                }),
                context: this,
                success: async(responseText, status, response) => {
                    const displayName = await getDisplayName();
                    await this.saveDigitalResourceName(
                        `Generated Response document for ${displayName}`,
                        response.responseJSON.tile.resourceinstance_id
                    );
                    await this.saveRelationship(response.responseJSON.tile.resourceinstance_id);
                },
                error: (response, status, error) => {
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
            
            // this.loading(false);
        };

        this.saveDigitalResourceName = async(name, resourceId) => {
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

        this.saveRelationship = async(resourceId) => {
            const id = uuid.generate();

            this.tile.data[this.RESPONSE_FILES_NODE] = [
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
                    [this.RESPONSE_FILES_NODE]: [
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

        this.form.workflow.finishWorkflow = () => {
            window.location.assign(this.form.workflow.quitUrl);
        };

        this.getFileTiles = async(resourceId) => {
            const fileTiles = [];

            await Promise.all(
                this.form.tiles().map((tile) => {
                    const digitalObjectResourceId = ko.toJS(tile.data)[this.RESPONSE_FILES_NODE]?.[0]
                        .resourceId;
                    if (!digitalObjectResourceId) return;
                    return $.ajax({
                        type: 'GET',
                        url:
              arches.urls.root +
              `resource/${digitalObjectResourceId}/tiles?nodeid=${this.DIGITAL_OBJECT_FILE_CONTENT_NODE}`,
                        context: this,
                        success: async(responseText, status, response) => {
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

            this.uploadedFiles(fileTiles.filter(tile => tile.name.includes('planning-response-combined')));
            this.uploadedFiles.valueHasMutated();
        };

        this.getFileTiles();

        this.downloadFile = async(url, name) => {
            const response = await fetch(url);
            const blob = await response.blob();

            const handle = await NativeFileSystemAdapter.showSaveFilePicker({
                suggestedName: name,
                types: [
                    {
                        description: 'Files'
                    }
                ]
            });

            const writableStream = await handle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();
        };

        this.form.saveMultiTiles = async(newTileId) => {
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

        this.previewDoc = (fileUrl, fileName) => {
            fetch(fileUrl)
                .then(async(response) => {
                    // Check if the response is successful
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const blob = await response.blob();
                    // Convert the response to a Blob

                    const element = document.getElementById('docx-preview-element');
                    await docxPreview.renderAsync(blob, element, null, {
                        ...docxPreview.defaultOptions,
                        breakPages: true,
                        debug: true,
                        experimental: true
                    });

                    return blob;
                })
                .catch((error) => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        };
    }

    ko.components.register('pdf-merger', {
        viewModel: viewModel,
        template: template
    });

    return viewModel;
});
