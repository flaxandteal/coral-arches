define([
  'knockout',
  'views/components/workflows/final-step',
  'geojson-extent',
  'arches',
  'moment',
  'views/components/map',
  'views/components/cards/select-feature-layers',
  'viewmodels/alert',
  'views/components/workflows/render-nodes'
], function (
  ko,
  FinalStep,
  geojsonExtent,
  arches,
  moment,
  MapComponentViewModel,
  selectFeatureLayersFactory,
  AlertViewModel
) {
  function viewModel(params) {
    FinalStep.apply(this, [params]);
    this.displayName = ko.observable();
    this.resourceData = ko.observable();
    this.relatedResources = ko.observableArray();

    this.getResourceData = function () {
      window
        .fetch(this.urls.api_resources(this.resourceid) + '?format=json&compact=false')
        .then((response) => response.json())
        .then((data) => {
          this.resourceData(data);
          this.displayName(this.resourceData().displayname);
        });
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

    this.renderNode = (config, tileData) => {
      let result = [];
      const tiles = tileData[config?.nodegroupId];

      const getNodeDataFromTile = (t) => {
        const nodeData = [];
        if (!config.renderNodeIds) {
          // If no render nodes specified render them all
          const allNodes = Object.values(t.data).filter((node) => !!node.displayValue);
          if (allNodes.length) {
            nodeData.push(Object.values(t.data));
          }
        } else {
          const filtered = [];
          for (const nodeIdObject of config.renderNodeIds) {
            if (typeof nodeIdObject === 'string' || nodeIdObject instanceof String) {
              if (!(nodeIdObject in t.data)) continue;
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
            if (!(nodeIdObject.nodeId in t.data) && !nodeIdObject?.defaultValue) continue;
            const node = t.data[nodeIdObject.nodeId] || {
              displayValue: null,
              label: null,
              nodeId: nodeIdObject.nodeId,
              value: null
            };
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
        return nodeData;
      };

      if (tiles) {
        if (Array.isArray(tiles)) {
          // Multi Tile Node
          for (const tile of tiles) {
            result = [...result, ...getNodeDataFromTile(tile)];
          }
        } else {
          // Single Tile Node
          result = getNodeDataFromTile(tiles);
        }
      }

      config.data = result;
      return config;
    };

    this.renderAllNodes = (nodeConfigs, tileData) => {
      /**
       * Deep copy of the config object to prevent object referecing.
       */
      nodeConfigs = JSON.parse(JSON.stringify(nodeConfigs));
      for (const [key, value] of Object.entries(nodeConfigs)) {
        const result = this.renderNode(value, tileData);
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
          const dateRegex = /\d{4}-\d{2}-\d{2}/;
          if (dateRegex.test(display.value)) {
            const parsedDate = moment(display.value, 'YYYY-MM-DD');
            const formattedDate = parsedDate.format('DD-MM-YYYY');
            display.value = formattedDate;
          }
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
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.hasNodeGroup = (tileData, nodeGroupId) => {
      return tileData.some((tile) => tile.nodegroup === nodeGroupId);
    };

    this.getResourceIds = (nodeConfigId, configKey) => {
      const ids = [];
      this.renderedNodegroups()[nodeConfigId]?.forEach((config) => {
        config[configKey].data.forEach((data) => {
          data.forEach((node) => {
            node.value.forEach((relationship) => {
              ids.push(relationship.resourceId);
            });
          });
        });
      });
      return ids;
    };

    this.renderResourceIds = async (ids, nodeConfigs) => {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      for (const id of ids) {
        const tiles = await this.fetchTileData(id);
        const formattedTiles = this.formatTileData(tiles);
        this.renderAllNodes(nodeConfigs, formattedTiles);
      }
    };

    this.getDisplayValue = (nodeConfigId, configKey, nodeId) => {
      let found = null;
      this.renderedNodegroups()[nodeConfigId]?.forEach((config) => {
        config[configKey]?.data.forEach((group) => {
          group.forEach((node) => {
            if (node.nodeId === nodeId) {
              found = node;
            }
          });
        });
      });
      return found?.displayValue;
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
