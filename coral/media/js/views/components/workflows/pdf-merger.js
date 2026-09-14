import _ from 'underscore';
import $ from 'jquery';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
import { hasListItem } from 'utils/reference-values';
import template from 'templates/views/components/workflows/pdf-merger.htm';
import { renderAsync as docxRenderAsync, defaultOptions as docxDefaultOptions } from 'docx-preview';
import { showSaveFilePicker } from 'native-file-system-adapter';

function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    /**
 * Matches structure of the Correspondence branch
 */
    this.RESPONSE_FILES_NODE = "7098e813-eebe-5903-a31f-951fd0c67a2c";
    // Renamed "Response Files Team" -> "Response Team Files" in the v8 graph.
    this.RESPONSE_FILE_TEAM_NODE = "b2b19bbb-7f8a-5291-9e44-fe968a305e51";

    this.RESPONSE_SUMMARY_NODE = "1103a85f-645c-5b9d-bf17-b9299fac0ded";
    this.RESPONSE_SUMMARY_TEAM_NODE = "cf6c76ac-3f89-5d22-a74b-2cdf80608b6e";

    this.HMTEAM = "03ea2b65-1def-5fc4-ae4e-70b5869d9696";
    this.HBTEAM = "8b7091c9-dcd2-578c-9775-814240a4ea01";

    this.ACTION_TYPE_NODE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11";


    this.TYPE_ASSIGN_HM = '72ce5d6a-f938-5eae-b650-608ca8b3b934';
    this.TYPE_ASSIGN_HB = '8ddddee6-a5d6-5532-9896-3696d0b45754';
    this.TYPE_ASSIGN_BOTH = '979eab2e-f1c8-532a-9de8-56604acbff2c';
    this.TYPE_REJECT = '4820872f-b74d-4767-984d-2874a076c4b4';

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
    this.loading = ko.observable(false);

    this.disableGenerate = ko.computed(() => {
        if (this.loading()){
            return true;
        }
        const assigned = this.assignedTo();
        if (hasListItem(assigned, this.TYPE_ASSIGN_BOTH)) {
            return !this.HMSummary() || !this.HBSummary();
        }
        if (hasListItem(assigned, this.TYPE_ASSIGN_HB)) {
            return !this.HBSummary();
        }
        if (hasListItem(assigned, this.TYPE_ASSIGN_HM)) {
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
            if(hasListItem(team, this.HMTEAM) && summary?.trim() !== ""){
                this.HMSummary(true);
            }
            if(hasListItem(team, this.HBTEAM) && summary?.trim() !== ""){
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
        this.loading(true);

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

        this.loading(false);
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

        const handle = await showSaveFilePicker({
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
                await docxRenderAsync(blob, element, null, {
                    ...docxDefaultOptions,
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

export default viewModel;
