define([
  'knockout',
  'views/components/workflows/final-step',
  'geojson-extent',
  'arches',
  'views/components/map',
  'views/components/cards/select-feature-layers',
  'viewmodels/alert'
], function (
  ko,
  FinalStep,
  geojsonExtent,
  arches,
  MapComponentViewModel,
  selectFeatureLayersFactory,
  AlertViewModel
) {
  function viewModel(params) {
    FinalStep.apply(this, [params]);
    this.resourceData = ko.observable();
    this.relatedResources = ko.observableArray();
    this.loading = ko.observable(false);

    this.getResourceData = function () {
      window
        .fetch(this.urls.api_resources(this.resourceid) + '?format=json&compact=false')
        .then((response) => response.json())
        .then((data) => this.resourceData(data));
    };

    this.getRelatedResources = function () {
      window
        .fetch(this.urls.related_resources + this.resourceid + '?paginate=false')
        .then((response) => response.json())
        .then((data) => this.relatedResources(data));
    };

    this.init = async () => {
      this.getResourceData();
      this.getRelatedResources();
    };

    this.getResourceValue = function (obj, attrs, missingValue = 'none') {
      try {
        return (
          attrs.reduce(function index(obj, i) {
            return obj[i];
          }, obj) || missingValue
        );
      } catch (e) {
        return missingValue;
      }
    };

    this.prepareMap = function (geojson, source) {
      var mapParams = {};
      if (geojson.features.length > 0) {
        mapParams.bounds = geojsonExtent(geojson);
        mapParams.fitBoundsOptions = { padding: 20 };
      }
      var sourceConfig = {};
      sourceConfig[source] = {
        type: 'geojson',
        data: geojson
      };
      mapParams.sources = Object.assign(sourceConfig, mapParams.sources);
      mapParams.layers = selectFeatureLayersFactory(
        '', //resourceid
        source, //source
        undefined, //sourceLayer
        [], //selectedResourceIds
        true, //visible
        '#ff2222' //color
      );
      MapComponentViewModel.apply(this, [
        Object.assign({}, mapParams, {
          activeTab: ko.observable(false),
          zoom: null
        })
      ]);

      this.layers = mapParams.layers;
      this.sources = mapParams.sources;
    };

    this.renderedNodegroups = ko.observable({});

    this.renderNode = async (key, tileData, config) => {
      console.log('tileData: ', tileData);
      console.log('key: ', key);
      let result = [];
      console.log('config: ', config);
      const tiles = tileData[config?.nodegroupId];
      console.log('tiles: ', tiles);

      const getNodeDataFromTile = async (t) => {
        console.log('t: ', JSON.stringify(t));
        const nodeData = [];
        if (!config.renderNodeIds) {
          // If no render nodes specified render them all
          console.log('nodeData: ', nodeData, Object.values(t.data));
          nodeData.push(Object.values(t.data));
        } else {
          const filtered = [];
          for await (const nodeIdObject of config.renderNodeIds) {
            if (!(nodeIdObject in t.data)) continue;
            if (typeof nodeIdObject === 'string' || nodeIdObject instanceof String) {
              // Use the node ID string to get the node object
              const node = t.data[nodeIdObject];
              if (node.displayValue) {
                filtered.push(node);
              }
              continue;
            }
            /**
             * This is the object notation path that allows you to
             * provide values such as: label, defaultValue, related
             */
            const node = t.data[nodeIdObject.nodeId];
            console.log('nodeIdObject: ', nodeIdObject);
            if (nodeIdObject.label) {
              node.label = nodeIdObject.label;
            }
            if (nodeIdObject.defaultValue && !node.displayValue) {
              node.displayValue = nodeIdObject.defaultValue;
            }
            filtered.push(node);
          }
          if (filtered.length) {
            nodeData.push(filtered);
          }
        }

        console.log('nodeData: ', nodeData);
        return nodeData;
      };

      if (tiles) {
        if (Array.isArray(tiles)) {
          // Multi Tile Node
          for await (const tile of tiles) {
            const temp = await getNodeDataFromTile(tile);
            console.log('temppppp: ', temp);
            result = [...result, ...(await getNodeDataFromTile(tile))];
          }
        } else {
          // Single Tile Node
          const temp = await getNodeDataFromTile(tiles);
          console.log('temppppp: ', temp);
          result = [...result, ...(await getNodeDataFromTile(tiles))];
        }
      }

      console.log('result: ', result);
      config.data = result;

      return config;
    };

    this.renderAllNodes = async (nodeConfigs, tileData) => {
      for await (const [key, value] of Object.entries(nodeConfigs)) {
        const result = await this.renderNode(key, tileData, value);
        nodeConfigs[key] = result;
      }
      if (!(nodeConfigs.id in this.renderedNodegroups())) {
        this.renderedNodegroups()[nodeConfigs.id] = [];
      }
      this.renderedNodegroups()[nodeConfigs.id].push(nodeConfigs);
      return nodeConfigs;
    };

    this.formatTileData = (tileData) => {
      const formatted = {};
      tileData.forEach((tile) => {
        const cardinality = !!tileData.find(
          (t) => t.tileid !== tile.tileid && t.nodegroup === tile.nodegroup
        );
        let cardinalityIdx = null;
        if (!cardinality) {
          formatted[tile.nodegroup] = {
            nodegroupId: tile.nodegroup,
            tileId: tile.tileid,
            data: {}
          };
        } else {
          if (tile.nodegroup in formatted) {
            formatted[tile.nodegroup].push({
              nodegroupId: tile.nodegroup,
              tileId: tile.tileid,
              data: {}
            });
            cardinalityIdx = formatted[tile.nodegroup].length - 1;
          } else {
            formatted[tile.nodegroup] = [];
            formatted[tile.nodegroup].push({
              nodegroupId: tile.nodegroup,
              tileId: tile.tileid,
              data: {}
            });
            cardinalityIdx = formatted[tile.nodegroup].length - 1;
          }
        }
        tile.display_values.forEach((display) => {
          console.log('cardinality: ', cardinality, cardinalityIdx);
          if (!cardinality) {
            formatted[tile.nodegroup]['data'][display.nodeid] = {
              nodeId: display.nodeid,
              label: display.label,
              displayValue: display.value,
              value: tile.data[display.nodeid]
            };
          } else {
            formatted[tile.nodegroup][cardinalityIdx]['data'][display.nodeid] = {
              nodeId: display.nodeid,
              label: display.label,
              displayValue: display.value,
              value: tile.data[display.nodeid]
            };
          }
        });
      });
      return formatted;
    };

    this.fetchTileData = async (resourceId) => {
      console.log('Fetching tiles for resource ID: ', resourceId);
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      console.log('Logging tilesResponse: ', tilesResponse, data.tiles);
      return data.tiles;
    };

    this.hasNodeGroup = (tileData, nodeGroupId) => {
      return tileData.some((tile) => tile.nodegroup === nodeGroupId);
    };

    this.getResourceIds = (nodeConfig) => {
      const ids = [];
      nodeConfig.data.forEach((data) => {
        data.forEach((node) => {
          node.value.forEach((relationship) => {
            ids.push(relationship.resourceId);
          });
        });
      });
      return ids;
    };

    this.renderResourceIds = async (ids, nodeConfigs) => {
      console.log('ids: ', ids);
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      for await (const id of ids) {
        const tiles = await this.fetchTileData(id);
        const formattedTiles = this.formatTileData(tiles);
        await this.renderAllNodes(nodeConfigs, formattedTiles);
      }
    };

    this.getData = async () => {
      console.log('summary-step.js: Please configure the getData function');
    };

    this.loadData = async () => {
      this.loading(true);
      await this.getData();
      this.loading(false);
    };

    this.init();
  }

  return viewModel;
});
