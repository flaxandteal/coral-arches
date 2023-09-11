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

       
      this.resourceData.subscribe((val) => {
        console.log('VAL', val)
        this.activityResourceData(val.resource)
        this.reportVals['areaName'] = val.resource["Activity Names"][0]["Activity Name"]["@value"]

        this.reportVals['siteAddress'] = val.resource["Location Data"]["Addresses"][0]

        // this.reportVals['appID'] = val.resource["System Reference Numbers"]["UUID"]["ResourceId"]["@value"]
        
        val.resource["External Cross References"].forEach(ref => {
          if (ref["External Cross Reference Source"]["@value"] === "Historic Environment Record Number"){
            this.reportVals['bFileNumber'] = ref["External Cross Reference"]["@value"]
          }
          if (ref["External Cross Reference Source"]["@value"] === "Excavation"){
            this.reportVals['licenseNo'] = ref["External Cross Reference"]["@value"]
          }
          if (ref["External Cross Reference Source"]["@value"] === "Wreck"){
            this.reportVals['wreckRef'] = ref["External Cross Reference"]["@value"]
            this.reportVals['wreckDesc'] = ref["External Cross Reference Notes"]["External Cross Reference Description"]["@value"]
          }
          if (ref["External Cross Reference Source"]["@value"] === "Historic Environment Record Number"){
            this.reportVals['bFileNo'] = ref["External Cross Reference"]["@value"]
          }
        });
      })

      this.relatedResources.subscribe((val) => {
        console.log('RELVAL', val)
        this.licenseResourceData(val.related_resources[0])
        this.reportVals['areaName'] = val.related_resources[0]
        this.reportVals["related_license"] = val["resource_relationships"][0]["resourceinstanceidfrom"]

        window.fetch(this.urls.api_resources(this.reportVals["related_license"]) + '?format=json&compact=false')
            .then(response => response.json())
            .then(data => this.licenseResourceData(data)).then(x => {console.log("after fetch!", this.licenseResourceData())})
            .then(x => {
              window.fetch(this.urls.api_tiles(this.licenseResourceData()['resource']['Associated Actors']['Associated Actor']['Actor']['@tile_id']) + '?format=json&compact=false')
              .then(response => response.json())
              .then(data => this.actorTileData(data)).then(x => {console.log("ACTO TILE ", this.actorTileData())})
              .then(x => {
                this.actorTileData().data['f5566e7e-48b6-11ee-85af-0242ac140007'].forEach((actor) => {
                  window.fetch(this.urls.api_resources(actor.resourceId) + '?format=json&compact=false')
                  .then(response => response.json())
                  .then(
                    data => this.actorReportData().push(data)
                  )
                })
                
              })
              .then(x => {
                console.log("ard", this.actorReportData())
                console.log("after ard")
                this.actorReportData().forEach((actor) => {
                  console.log("actor", actor)
                  console.log("act graph",actor.graph_id)
                  if (actor.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588'){
                    console.log(actor["Location Data"])
                    if (actor["Location Data"]){
                      this.reportVals['applicantAddresses'] = actor["Location Data"].Addresses
                    }
                    
                  }
                  if (actor.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588'){
                    console.log(actor["Location Data"])
                    if (actor["Location Data"]){
                      this.reportVals['companyAddresses'] = actor["Location Data"].Addresses
                    }
                    
                  }
                })
              }).then(x => {console.log("repVals",this.reportVals)})
            })
      })

      

      
    }
  
    ko.components.register('license-cover-letter', {
      viewModel: viewModel,
      template: licenseCoverTemplate
    });
    return viewModel;
  });