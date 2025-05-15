define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'templates/views/components/cards/default.htm',
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, componentTemplate) {
    function viewModel(params) {

    const NODEGROUP_ID = params.nodegroupid;
    const SEV_NODE = "3cfb8560-2a75-11f0-b5c0-62d3208fcf53";
    const LIKELIHOOD_NODE = "7487478a-2a75-11f0-b5c0-62d3208fcf53";
    const CALCULATED_RISK_NODE = "ceac4b20-2a75-11f0-b5c0-62d3208fcf53";
    const SELECTED_SEV_VALUE = ko.observable();
    const SELECTED_LIKELIHOOD_VALUE = ko.observable();

    CardComponentViewModel.apply(this, [params]);

      if (this.tile.data[SEV_NODE] && ko.isObservable(this.tile.data[SEV_NODE])) {
        this.tile.data[SEV_NODE].subscribe(async () => {
          const calculateRiskValue = await this.calculateRisk();
          this.tile.data[CALCULATED_RISK_NODE](calculateRiskValue)
        })
      }

      if (this.tile.data[LIKELIHOOD_NODE] && ko.isObservable(this.tile.data[LIKELIHOOD_NODE])) {
        this.tile.data[LIKELIHOOD_NODE].subscribe(async () => {
          const calculateRiskValue = await this.calculateRisk();
          this.tile.data[CALCULATED_RISK_NODE](calculateRiskValue)
        })
      }

      this.fetchTileData = async (resourceId) => {

        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
            (NODEGROUP_ID ? `?nodeid=${NODEGROUP_ID}` : '')
        );

        const data = await tilesResponse.json();

        return data.tiles;
      };

      this.getValFromTileID = async (tileID) => {
        const tilesResponse = await window.fetch(
            arches.urls.api_nodes(tileID ? `?nodeid=${tileID}` : '')
          );

        const data = await tilesResponse.json();

        return data;
      };

      this.getSeverity = async () => {
        const value = this.tile.data[SEV_NODE]();
        const severityList = await this.getValFromTileID(SEV_NODE);

        if (severityList == null || value == null) return;

        severityList[0]['config']['options'].forEach((val) => {
            if (val.id === value) {
                SELECTED_SEV_VALUE(val.text);
            }
        });

        switch(SELECTED_SEV_VALUE()) {
            case "1 - Negligible":
                return 1;
            case "2 - Slight":
                return 2;
            case "3 - Moderate":
                return 3;
            case "4 - Major":
                return 4;
            case "5 - Multiple":
                return 5;
            default:
              return 0;
          } 
      };

      this.getLikelihood = async () => {
        const value = this.tile.data[LIKELIHOOD_NODE]();
        const likelihoodList = await this.getValFromTileID(LIKELIHOOD_NODE);

        if (likelihoodList == null || value == null) return;

        likelihoodList[0]['config']['options'].forEach((val) => {
            if (val.id === value) {
                SELECTED_LIKELIHOOD_VALUE(val.text);
            }
        });

        switch(SELECTED_LIKELIHOOD_VALUE()) {
            case "1 - Very Unlikely":
                return 1;
            case "2 - Unlikely":
                return 2;
            case "3 - Possible":
                return 3;
            case "4 - Reasonably likely":
                return 4;
            case "5 - Certain":
                return 5;
            default:
              return 0;
          } 
      };

      this.calculateRisk = async () => {
        this.severity = await this.getSeverity();
        this.likelihood = await this.getLikelihood();

        if (this.severity == null || this.likelihood == null) return 0;

        const riskValue = this.severity * this.likelihood;
        return riskValue;
      };

      this.getLatestTile = async () => {
        try {
          const tiles = await this.fetchTileData(this.tile.resourceinstance_id);
  
          if (!tiles?.length) return;
  
          const tile = tiles[0];
      
          if (!tile) return;
  
          Object.keys(tile.data).forEach((nodeId) => {
            this.setValue(tile.data[nodeId], nodeId);
          });
  
          this.tile.tileid = tile.tileid;
  
          // Reset dirty state
          this.tile._tileData(koMapping.toJSON(this.tile.data));
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

    
  
    ko.components.register('get-calculated-risk', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
  