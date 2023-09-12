define([
    'knockout',
    'arches',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/licensing-workflow/license-cover-letter.htm'
    
  ], function (ko, arches, SummaryStep, licenseCoverTemplate) {
    function viewModel(params) {
      self = this
      SummaryStep.apply(this, [params]);
      console.log("The paramaters", params)
      console.log("this", this)
      this.activityResourceData = ko.observable()
      this.licenseResourceData = ko.observable()
      this.actorTileData = ko.observable()
      this.actorReportData = ko.observable([])
      this.reportVals = {}
      this.applicant = ko.observable('')
      this.company = ko.observable('')
      this.test = ko.observable('hello' + this.applicant())
      this.areaName = ko.observable('')
      this.bFileNumber = ko.observable('')
      this.licenseNo = ko.observable('')
      this.seniorInspector = ko.observable('')
      this.signed = ko.observable('')
      this.recievedDate = ko.observable('')
      this.acknowledgedDate = ko.observable('')
      this.sendDate = ko.observable(new Date().toLocaleDateString())
      this.buildingName = ko.observable('')
      this.buildingNumber = ko.observable('')
      this.street = ko.observable('')
      this.buildingNumberSubSt = ko.observable('')
      this.subStreet = ko.observable('')
      this.city = ko.observable('')
      this.county = ko.observable('')
      this.postCode = ko.observable('')
       


      this.address = ko.computed({

        read: function () {
          return `${this.buildingName() != '' ? this.buildingName() + ', <br />' : ''} 
          ${this.buildingNumber()} ${this.street()}, 
          ${this.buildingNumberSubSt() != '' ? this.buildingNumberSubSt() + ' ' : ''}
          ${this.subStreet() != '' ? this.subStreet() + ',' : ''}
          <br />${this.city()},
          <br />${this.county()},
          <br />${this.postCode()}`
        },
        write: function (){

        }
        }, this)

       
      this.resourceData.subscribe((val) => {
        console.log('VAL', val)
        this.loading(true)
        this.activityResourceData(val.resource)
        this.reportVals['areaName'] = val.resource["Activity Names"][0]["Activity Name"]["@value"]
        this.areaName(this.reportVals['areaName'])
        this.reportVals['siteAddress'] = val.resource["Location Data"]["Addresses"][0]

        // this.reportVals['appID'] = val.resource["System Reference Numbers"]["UUID"]["ResourceId"]["@value"]
        
        val.resource["External Cross References"].forEach(ref => {
          if (ref["External Cross Reference Source"]["@value"] === "Historic Environment Record Number"){
            this.reportVals['bFileNumber'] = ref["External Cross Reference"]["@value"]
            this.bFileNumber(this.reportVals['bFileNumber'])
          }
          if (ref["External Cross Reference Source"]["@value"] === "Excavation"){
            this.reportVals['licenseNo'] = ref["External Cross Reference"]["@value"]
            this.licenseNo(this.reportVals['licenseNo'])
          }
          if (ref["External Cross Reference Source"]["@value"] === "Wreck"){
            this.reportVals['wreckRef'] = ref["External Cross Reference"]["@value"]
            this.reportVals['wreckDesc'] = ref["External Cross Reference Notes"]["External Cross Reference Description"]["@value"]
          }
        });
        this.loading(false)
      })

      this.relatedResources.subscribe((val) => {
        console.log('RELVAL', val)
        this.licenseResourceData(val.related_resources[0])
        this.reportVals['areaName'] = val.related_resources[0]
        this.licenseResourceData().dates.forEach(date => {
          if (date.nodeid === "6b96c722-48c7-11ee-ba3a-0242ac140007") {
            this.reportVals.recievedDate = new Date(date.date / 10000, (date.date % 10000 / 100) - 1, date.date % 100).toLocaleDateString();
            this.recievedDate(this.reportVals.recievedDate)
          }
          if (date.nodeid === "0a914884-48b4-11ee-90a8-0242ac140007") {
            this.reportVals.acknowledgedDate = date.date
            this.acknowledgedDate(this.reportVals.acknowledgedDate)
          }
        })
        this.loading(false)

        this.reportVals["related_license"] = val["resource_relationships"][0]["resourceinstanceidfrom"]
        this.loading(true)
        window.fetch(this.urls.api_resources(this.reportVals["related_license"]) + '?format=json&compact=false')
            .then(response => response.json())
            .then(data => this.licenseResourceData(data)).then(x => {
              this.loading(true)
              this.reportVals["decisionMadeBy"] = this.licenseResourceData()["resource"]["Decision"]["Decision Assignment"]["Decision Made By"]["@value"]; 
              this.seniorInspector(this.reportVals["decisionMadeBy"])
              this.signed(this.reportVals["decisionMadeBy"])
              this.loading(false)
            })
            .then(x => {
              window.fetch(this.urls.api_tiles(this.licenseResourceData()['resource']['Associated Actors']['Associated Actor']['Actor']['@tile_id']) + '?format=json&compact=false')
              .then(response => response.json())
              .then(data => this.actorTileData(data)).then(x => {this.loading(true)})
              .then(x => {
                console.log(this.actorTileData().data)
                console.log(JSON.stringify(this.actorTileData().data))

                this.actorTileData().data['f5566e7e-48b6-11ee-85af-0242ac140007'].forEach((actor) => {
                  window.fetch(this.urls.api_resources(actor.resourceId) + '?format=json&compact=false')
                  .then(response => response.json())
                  .then(
                    data => {this.loading(true); this.actorReportData().push(data)})
                  .then(x => {
                    this.loading(true)
                    this.actorReportData().forEach(actor => {
                      console.log("actor", actor)
                      console.log("act graph",actor.graph_id)
                      if (actor.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588'){
                        console.log(actor["resource"]["Location Data"])
                        this.reportVals['applicant'] = actor["resource"]["Name"][0]["Full Name"]["@value"]
                        this.applicant(this.reportVals.applicant)
                        if (actor["resource"]["Location Data"]){
                          this.reportVals['applicantAddresses'] = 
                          {
                            buildingName : actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"],
                            buildingNumber : actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"],
                            street : actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"],
                            buildingNumberSubSt : actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
                            subStreet : actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"],
                            city : actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"],
                            county : actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"],
                            postCode : actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]
                          }
                          this.buildingName(this.reportVals['applicantAddresses']['buildingName'])
                          this.buildingNumber(this.reportVals['applicantAddresses']['buildingNumber'])
                          this.street(this.reportVals['applicantAddresses']['street'])
                          this.buildingNumberSubSt(this.reportVals['applicantAddresses']['buildingNumberSubSt'])
                          this.subStreet(this.reportVals['applicantAddresses']['subStreet'])
                          this.city(this.reportVals['applicantAddresses']['city'])
                          this.county(this.reportVals['applicantAddresses']['county'])
                          this.postCode(this.reportVals['applicantAddresses']['postCode'])
                          // `${actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"] + ', <br />' : ''} 
                          //  ${actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"]} ${actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"]}, 
                          //  ${actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"] + ', <br />' : ''}
                          //  ${actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"] + ', <br />' : ''}
                          //  <br />${actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"]},
                          //  <br />${actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"]},
                          //  <br />${actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]}`
                        }
                        this.address(this.reportVals['applicantAddresses'])
                      }
                      if (actor.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588'){
                        console.log(actor["resource"]["Location Data"])
                        this.reportVals['company'] = actor["resource"]["Names"][0]["Organization Name"]["@value"]
                        this.company(this.reportVals['company'])
                        if (actor["resource"]["Location Data"]){
                          this.reportVals['companyAddresses'] = 
                          {
                            buildingName : actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"],
                            buildingNumber : actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"],
                            street : actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"],
                            buildingNumberSubSt : actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
                            subStreet : actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"],
                            city : actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"],
                            county : actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"],
                            postCode : actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]
                          }
                        }
                      }
                    })
                    this.loading(false)
                  })
                })
                
              })
                    .then(x => {this.loading(false); console.log("repVals",this.reportVals)})
            })
      })

      

      
    }
  
    ko.components.register('license-cover-letter', {
      viewModel: viewModel,
      template: licenseCoverTemplate
    });
    return viewModel;
  });