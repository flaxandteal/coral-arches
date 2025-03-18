define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'templates/views/components/workflows/assign-consultation-workflow/related-heritage-asset-map.htm'
], function(_, ko, koMapping, uuid, arches, CardComponentViewModel, componentTemplate) {
    function viewModel(params) {
        CardComponentViewModel.apply(this, [params]);
        this.RELATED_HERITAGE_NODE_ID = 'bc64746e-cf4a-11ef-997c-0242ac120007';
        this.GEO_NODE_ID = '87d3872b-f44f-11eb-bd0c-a87eeabdefba';
        this.tileId = this.tile.tileid;
        this.resourceId = this.tile.resourceinstance_id;
        this.shouldRender = ko.observable(false);

        this.fetchTileData = async(resourceId, nodeId) => {
            try{
                const tilesResponse = await window.fetch(
                    arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
              (nodeId ? `?nodeid=${nodeId}` : '')
                );
                const data = await tilesResponse.json();

                return data.tiles;
            }
            catch (error){
                console.error("Error fetching data:", error);
                return null;
            }
            
        };

        this.getRelatedHeritage = async() => {
            this.assets = await this.fetchTileData(params.resourceid, this.RELATED_HERITAGE_NODE_ID);
            if (!this.assets?.length) return;
            this.assets = this.assets[0].data[this.RELATED_HERITAGE_NODE_ID];
      
            let geometries = [];

            for (const tile of this.assets) {
                const data = await this.getGeoJsonData(tile.resourceId);
                if (data && Array.isArray(data)) {
                    geometries = [...geometries, ...data];
                }
            }
            return geometries;
        };

        this.getGeoJsonData = async(resourceId) => {
            try {
                this.assets = await this.fetchTileData(resourceId, this.GEO_NODE_ID);

                if (this.assets[0] !== undefined) {
                    let featureData = this.assets[0].data['87d3d7dc-f44f-11eb-bee9-a87eeabdefba']['features'];
                    return featureData;
                } else {
                    return;
                }
      
            } catch (error) {
                console.error("Error fetching GeoJSON data:", error);
                return null;
            }
        };

        this.getGeometryData = async() => {
            this.featureData = await this.getRelatedHeritage();
            if(!this.featureData) return null;
            this.geometry = {
                "type": "FeatureCollection",
                "features": this.featureData
            };            
            return this.geometry;
        };

        this.getLatestTile = async() => {
            try {
                const tiles = await this.fetchTileData(this.resourceId, params.nodegroupid);
                const geom = await this.getGeometryData();

                // Check for existing data, if none get the HA geometries
                if (!tiles?.length) {  
                    if(!geom?.features?.length) {
                        this.shouldRender(true);
                        return;
                    }              
                    geom.features.forEach( feature => {
                        feature.properties.nodeId = params.resourceid;
                    });
                    this.setValue(geom, '083f3c7e-ca61-11ee-afca-0242ac180006');
                }
                // Checking if the HA geometries match the number of saved geometries
                else if (tiles[0].data['083f3c7e-ca61-11ee-afca-0242ac180006'] && geom){
                    const existingGeom = tiles[0].data['083f3c7e-ca61-11ee-afca-0242ac180006'];
                    const savedPoints = existingGeom.features.filter(feature => feature.geometry.type === 'Point');
                    const haPoints = geom.features.filter(feature => feature.geometry.type === 'Point');

                    if(savedPoints.length > haPoints.length){
                        // Removes points if a HA is removed, all polygons are removed as they cannot be linked with a point
                        const haIds = geom.features.map(f => f.id);
                        existingGeom.features = existingGeom.features.filter(feature => feature.geometry.type === 'Point' && haIds.includes(feature.id));        
                    } else {
                        // Update the tile with the HA geometries
                        const existingIds = existingGeom.features.map(f => f.id);
                        const newPoints = geom.features.filter(g => !existingIds.includes(g.id));
                        if(newPoints.length){
                            newPoints.forEach(feature => {
                                feature.properties.nodeId = params.resourceId;
                                existingGeom.features.push(feature);
                            });
                        }
                    }
                    this.setValue(existingGeom, '083f3c7e-ca61-11ee-afca-0242ac180006'); 
                }
                // Return the existing saved tiles for the consultation
                else {
                    const tile = tiles[0];

                    if (!tile) {
                        this.shouldRender(true);
                        return;
                    }
                    
                    Object.keys(tile.data).forEach((nodeId) => {
                        this.setValue(tile.data[nodeId], nodeId);
                    });
                    this.tile.tileid = tile.tileid;
                    // Reset dirty state
                    this.tile._tileData(koMapping.toJSON(this.tile.data));
                }
                this.shouldRender(true);
            } catch (err) {
                console.error('failed fetching tile: ', err);
            }
        };

        this.setValue = (value, nodeId) => {
            if (ko.isObservable(this.tile.data[nodeId])) {
                this.tile.data[nodeId](value);
            } else {
                this.tile.data[nodeId] = ko.observable();
                this.tile.data[nodeId](value);
            }
        };

        this.getLatestTile();
    }
    ko.components.register('related-heritage-asset-map', {
        viewModel: viewModel,
        template: componentTemplate
    });

    return viewModel;
});
