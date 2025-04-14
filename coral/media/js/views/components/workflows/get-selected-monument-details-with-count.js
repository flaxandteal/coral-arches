define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/get-selected-monument-details-with-count.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.HERRITAGE_ASSET_REFERENCES_NODEGROUP = 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
    this.SMR_NUMBER_NODE = '158e1ed2-3aae-11ef-a2d0-0242ac120003';

    this.DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba';
    this.DESIGNATIONS_TYPE_NODE = '6af2a0ce-efc5-11eb-88d1-a87eeabdefba';

    this.MONUMENT_NAMES_NODEGROUP = '676d47f9-9c1c-11ea-9aa0-f875a44e0e11';
    this.MONUMENT_NAMES_NODE = '676d47ff-9c1c-11ea-b07f-f875a44e0e11';

    this.CM_REFERENCE_NODEGROUP = '3d415e98-d23b-11ee-9373-0242ac180006';
    this.CM_REFERENCE_NODE = '3d419020-d23b-11ee-9373-0242ac180006';

    this.ADDRESSES_NODEGROUP = '87d39b25-f44f-11eb-95e5-a87eeabdefba';
    this.TOWNLAND_NODEGROUP = '919bcb94-345c-11ef-a5b7-0242ac120003';
    this.TOWNLAND_NODE = 'd033683a-345c-11ef-a5b7-0242ac120003';
    this.COUNTY_NODE = "87d3ff32-f44f-11eb-aa82-a87eeabdefba";

    this.BFILE_NODEGROUP = "4e6c2d46-1f3f-11ef-ac74-0242ac150006";
    this.BFILE_NODE = "72331a22-4ff1-11ef-a810-0242ac120009";

    this.CONSTRUCTION_NODEGROUP = "77e8f287-efdc-11eb-a790-a87eeabdefba";
    this.HA_TYPE_NODE = "77e90834-efdc-11eb-b2b9-a87eeabdefba";

    this.haRefStrings = {
      '158e1ed2-3aae-11ef-a2d0-0242ac120003': 'SMR Number',
      '250002fe-3aae-11ef-91fd-0242ac120003': 'HB Number',
      '1de9abf0-3aae-11ef-91fd-0242ac120003': 'IHR Number',
      '2c2d02fc-3aae-11ef-91fd-0242ac120003': 'Historic Parks and Gardens Number'
    }

    const MONUMENT_COUNT_NODE = "dc809034-04ba-11f0-8d60-9e7c335817fb";
    const SCHEDULED_MONUMENT_COUNT_NODE = "49d44590-04bb-11f0-8d60-9e7c335817fb";
    const HA_NODE = "2b4cfdac-04ba-11f0-9182-9e7c335817fb";

    this.labels = params.labels || [];

    this.selectedMonuments = ko.observable([]);

    this.cards = ko.observable({})

    this.dataNode = params.node;

    const self = this;

    this.searchString = params.searchString;

    this.form
      .card()
      ?.widgets()
      .forEach((widget) => {
        this.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });

    this.tile.data[this.dataNode].subscribe((value) => {
      if (value && value.length) {
        const currentResources = value.map(t => ko.unwrap(t.resourceId))
        currentResources.forEach(id => {
          this.cards({
            ...this.cards(), [id]: {
              haType: "",
              monumentName: "",
              cmNumber: "",
              smrNumber: "",
              countyValue: "",
              townlandValue: ""
            }
          })
          this.getMonumentDetails(id);
        })
        this.selectedMonuments(currentResources);
      } else {
        this.selectedMonuments([])
      }
    }, this);

    this.fetchTileData = async(resourceId, nodeId=null) => {
      console.log("node", resourceId, nodeId)
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    let previousValue;

    // get the old value of the drop down
    if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
      this.tile.data[HA_NODE].subscribe(async(oldValue) => {
        previousValue = oldValue;
      }, null, "beforeChange");
    }

    // get the new value and compare with the previous to find what has been added
    if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
      this.tile.data[HA_NODE].subscribe(async(newValue) => {
        let newEntry = [];
        if (previousValue){
          newEntry = newValue.filter(item => previousValue.indexOf(item) === -1);
        } else {
          newEntry = newValue;
        }
        const monumentCount = this.tile.data[HA_NODE]().length;
        this.tile.data[MONUMENT_COUNT_NODE](monumentCount);
        const scheduledMonumentCount = await this.returnScheduledMonumentCount(ko.unwrap(newEntry[0].resourceId));
        this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE](this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE]() + scheduledMonumentCount);
      }, "arrayChange");
    };

    // check the HA recommend for scheduled monument - only present if revision merged in
    this.returnScheduledMonumentCount = async(resourceId) => {
      const RECOMMENDED_DESIGNATION_NODE = "74ef37e0-37b5-11ef-9263-0242ac150006"
      const SCHEDULED_MONUMENT_CONCEPT = "40462188-3aa9-cdaf-8b1d-3ed8dfa57df9"
      const tileData = await this.fetchTileData(resourceId, RECOMMENDED_DESIGNATION_NODE);
      for(const tile of tileData){
        if(tile.data[RECOMMENDED_DESIGNATION_NODE].includes(SCHEDULED_MONUMENT_CONCEPT)){
          return 1;
        }
      }
      return 0;
    }
       
    
    this.getLatestTile = async () => {
      try {
        const tiles = await this.fetchTileData(this.tile.resourceinstance_id, this.dataNode);

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

    this.getMonumentDetails = async (resourceId) => {
      const tiles = await this.fetchTileData(resourceId);
      const countyValue = ko.observable('None');
      const monumentName = ko.observable('None');
      const haRefNumber = ko.observable('None');
      const haNumberLabel = ko.observable('Heritage Asset Ref Number');
      const haType = ko.observableArray(['None']);
      const townlandValue = ko.observableArray(['None']);

      const additionalPromises = []

      for (const tile of tiles) {
        if (tile.nodegroup === this.HERRITAGE_ASSET_REFERENCES_NODEGROUP) {
          for (const [key, value] of Object.entries(tile.data)) {
            if (value) {
              haRefNumber(value.en.value);
              haNumberLabel(this.haRefStrings[key]);
            }
          }
        }

        if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
          monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
        }

        if (tile.nodegroup === this.ADDRESSES_NODEGROUP) {
          const townlandData = tile.data[this.TOWNLAND_NODE];
          const countyData = tile.data[this.COUNTY_NODE];
        
          const idsToFetch = []
          if (townlandData){
            townlandValue.removeAll();
            townlandData.forEach(id => {
              idsToFetch.push({ key: this.TOWNLAND_NODE, id })
            })
          }
          if (countyData){
            idsToFetch.push({ key: this.COUNTY_NODE, id: countyData})
          }
          
          idsToFetch.forEach(id => {
            additionalPromises.push($.ajax({
              type: 'GET',
              url: arches.urls.concept_value + `?valueid=${id.id}`,
              context: self,
              success: function (responseJSON, status, response) {
                if(id.key === this.TOWNLAND_NODE){
                  townlandValue.push(responseJSON.value);
                }
                else if(id.key === this.COUNTY_NODE){
                  countyValue(responseJSON.value);
                }
              },
              error: function (response, status, error) {
                if (response.statusText !== 'abort') {
                  const alert = new AlertViewModel(
                    'ep-alert-red',
                    arches.requestFailed.title,
                    response.responseText
                  )
                  this.viewModel.alert(alert);
                }
                return
              }
            }))
          })
        }

        if (tile.nodegroup === this.CONSTRUCTION_NODEGROUP) {
          const typeId = tile.data[this.HA_TYPE_NODE];
          if (!typeId) continue;
          haType.removeAll()
          typeId.forEach(id => {
            additionalPromises.push($.ajax({
              type: 'GET',
              url: arches.urls.concept_value + `?valueid=${id}`,
              context: self,
              success: function (responseJSON, status, response) {
                haType.push(responseJSON.value);
              },
              error: function (response, status, error) {
                if (response.statusText !== 'abort') {
                  const alert = new AlertViewModel(
                    'ep-alert-red',
                    arches.requestFailed.title,
                    response.responseText
                  )
                  this.viewModel.alert( alert );
                }
                return
              }
            }))
          })
        }
      }

      await Promise.all(additionalPromises);

      this.cards({
        ...this.cards(), [resourceId]: {
          haType: haType(),
          monumentName: monumentName(),
          haNumberLabel: haNumberLabel(),
          smrNumber: haRefNumber(),
          countyValue: countyValue(),
          townlandValue: townlandValue()
        }
      })
    }
  }


  ko.components.register('get-selected-monument-details-with-count', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
