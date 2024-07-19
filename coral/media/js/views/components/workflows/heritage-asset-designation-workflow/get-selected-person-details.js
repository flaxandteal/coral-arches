define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'viewmodels/alert',
    'templates/views/components/workflows/heritage-asset-designation-workflow/get-selected-person-details.htm'
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
    function viewModel(params) {
      CardComponentViewModel.apply(this, [params]);
      console.log(this.tile.data)
  
      this.PERSON_NAME_NODEGROUP = '4110f741-1a44-11e9-885e-000d3ab1e588'
      this.PERSON_TITLE_NODE = '6da2f03b-7e55-11ea-8fe5-f875a44e0e11'
      this.PERSON_FULL_NAME_NODE = '5f8ded26-7ef9-11ea-8e29-f875a44e0e11'
  
      this.PERSON_CONTACT_POINT_NODEGROUP = '2547c12f-9505-11ea-a507-f875a44e0e11'
      this.PERSON_CONTACT_POINT_NODE = '2547c133-9505-11ea-8e49-f875a44e0e11'
  
      this.PERSON_ADDRESSES_NODEGROUP = '5f93048e-80a9-11ea-b0da-f875a44e0e11'
      this.PERSON_FULL_ADDRESS_NODE = 'b3a27611-effb-11eb-a79c-a87eeabdefba'
      this.PERSON_BUILDING_NAME_NODE = 'b3a2761d-effb-11eb-9867-a87eeabdefba'
      this.PERSON_BUILDING_NUMBER_NODE = 'b3a2761f-effb-11eb-9059-a87eeabdefba'
      this.PERSON_STREET_NODE = 'b3a27621-effb-11eb-83e6-a87eeabdefba'
      this.PERSON_TOWN_OR_CITY_NODE = 'b3a27617-effb-11eb-a80f-a87eeabdefba'
      this.PERSON_COUNTY_NODE = 'b3a28c1d-effb-11eb-95a1-a87eeabdefba'
      this.PERSON_POSTCODE_NODE = 'b3a27619-effb-11eb-a66d-a87eeabdefba'
  
      this.PERSON_CORRESPONDENCE_NODEGROUP = '2547c12f-9505-11ea-a507-f875a44e0e11'
      this.PERSON_CORRESPONDENCE_NAMES_NODEGROUP = '2beefb51-4084-11eb-9b2b-f875a44e0e11'
      this.PERSON_CORRESPONDENCE_NAME_NODE = '2beefb56-4084-11eb-bcc5-f875a44e0e11'
      this.PERSON_CORRESPONDENCE_EMAIL_NODE = '2547c133-9505-11ea-8e49-f875a44e0e11'
  
      
  
      this.COMPANY_NAMES_NODEGROUP = 'e8431c5d-8098-11ea-8348-f875a44e0e11'
      this.COMPANY_NAME_NODE = 'e8431c61-8098-11ea-8b01-f875a44e0e11'
  
      this.COMPANY_CORRESPONDENCE_NODEGROUP = '1b6f9cb4-51ae-11eb-a1fe-f875a44e0e11'
      this.COMPANY_CORRESPONDENCE_NAME_NODE = '1b6f9cb9-51ae-11eb-9ece-f875a44e0e11'
      this.COMPANY_EMAIL_NODE = '1b6f9cbf-51ae-11eb-b61d-f875a44e0e11'
  
      this.COMPANY_ADDRESSES_NODEGROUP = 'af3b0116-29a9-11eb-8333-f875a44e0e11'
      this.COMPANY_FULL_ADDRESS_NODE = '9e7907c7-eff3-11eb-b606-a87eeabdefba'
      this.COMPANY_BUILDING_NAME_NODE = '9e7907d3-eff3-11eb-ac11-a87eeabdefba'
      this.COMPANY_BUILDING_NUMBER_NODE = '9e7907d5-eff3-11eb-a511-a87eeabdefba'
      this.COMPANY_STREET_NODE = '9e7907d7-eff3-11eb-8e7a-a87eeabdefba'
      this.COMPANY_LOCALITY_NODE = '9e7907cd-eff3-11eb-b0f1-a87eeabdefba'
      this.COMPANY_COUNTY_NODE = '9e791cfe-eff3-11eb-9c35-a87eeabdefba'
      this.COMPANY_POSTCODE_NODE = '9e7907cf-eff3-11eb-8412-a87eeabdefba'
  
      this.labels = params.labels || [];

  
      this.selectedMonument = ko.observable();
  
      this.designationType = ko.observable();
      this.monumentName = ko.observable();
      this.cmNumber = ko.observable();
      this.smrNumber = ko.observable();
      this.townlandValue = ko.observable();
      this.detailNodes = ko.observable(params.detailNodes)
      this.selectedPeople = ko.observable({})
  
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

      this.fetchTileData = async (resourceId) => {
        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
        );
        const data = await tilesResponse.json();
        return data.tiles;
      };

      this.getPersonDetails = async (resourceId, node) => {
        const tiles = await this.fetchTileData(resourceId);
        for (const tile of tiles) {
          if (tile.nodegroup === this.PERSON_NAME_NODEGROUP) {
            this.selectedPeople()[node]().name(tile.data[this.PERSON_FULL_NAME_NODE])
          }
          if (tile.nodegroup === this.PERSON_CONTACT_POINT_NODEGROUP) {
            this.selectedPeople()[node]().contact(tile.data[this.PERSON_CONTACT_POINT_NODE])
          }
          if (tile.nodegroup === this.PERSON_ADDRESSES_NODEGROUP) {

            if (tile.data[this.PERSON_FULL_ADDRESS_NODE]) {
              this.selectedPeople()[node]().address(null)
              this.selectedPeople()[node]().address(tile.data[this.PERSON_FULL_ADDRESS_NODE])
            } else {
              let fullAddress = `
              ${tile.data[this.PERSON_BUILDING_NAME_NODE].en.value ? tile.data[this.PERSON_BUILDING_NAME_NODE].en.value +",\n": ""}
              ${tile.data[this.PERSON_BUILDING_NUMBER_NODE].en.value} ${tile.data[this.PERSON_STREET_NODE].en.value},\n
              ${tile.data[this.PERSON_TOWN_OR_CITY_NODE].en.value},\n
              ${tile.data[this.PERSON_COUNTY_NODE].en.value},\n
              ${tile.data[this.PERSON_POSTCODE_NODE].en.value}
              `
              this.selectedPeople()[node]().address({en: {value: fullAddress}})
            }

          }
        }
      };
      

      params.detailNodes.forEach(node => {
        this.selectedPeople()[node] = ko.observable({ 
          value : ko.observable(),
          name : ko.observable(),
          contact : ko.observable(),
          address : ko.observable()
        })
        this.tile.data[node].subscribe((value) => {
            if (value && value.length) {
                const resourceId = value[0].resourceId();
                this.selectedPeople()[node]().value(resourceId);
                this.getPersonDetails(resourceId, node);
            }
        }, this);
        if (this.tile.data[node]()) {
          console.log("there's data", this.tile.data[node]())
          this.getPersonDetails(this.tile.data[node]()[0].resourceId, node)
        }
      })
  
    }

  
    ko.components.register('get-selected-person-details', {
      viewModel: viewModel,
      template: template
    });
  
    return viewModel;
  });
  