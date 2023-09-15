define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/licensing-workflow/license-final-step.htm',
], function (ko, SummaryStep, licenseFinalStepTemplate) {
  function viewModel(params) {
    SummaryStep.apply(this, [params]);
    var self = this
    console.log(SummaryStep)

    this.siteAddress = {}
    this.observedSiteAddress = ko.observable({})
    this.siteAddressIndex = ko.observable(0)

    // const self = this;
    this.resourceid = params.resourceid;
    this.reportVals = {
      assetNames: [],
      assetNotes: [],
      wreckNames: [],
      wreckNotes: [],
      county : ko.computed({
        read: function() {
          console.log("county comp")
          console.log(self.siteAddressIndex(), JSON.stringify(self.siteAddress), self.siteAddress)
          return self.observedSiteAddress().counties ? self.observedSiteAddress().counties[self.siteAddressIndex()].en.value : ''
      },
    }),
      siteAddress : ko.computed({
        read: function () {
          if (self.observedSiteAddress().buildingNumbers){
            return `${self.observedSiteAddress().buildingNames ? self.observedSiteAddress().buildingNames[self.siteAddressIndex()].en.value + ', <br />' : ''} 
            ${self.observedSiteAddress().buildingNumbers[self.siteAddressIndex()].en.value} ${self.observedSiteAddress().streets[self.siteAddressIndex()].en.value}, 
            ${self.observedSiteAddress().subStreetNumbers ? self.observedSiteAddress().subStreetNumbers[self.siteAddressIndex()].en.value + ' ' : ''}
            ${self.observedSiteAddress().subStreets ? self.observedSiteAddress().subStreets[self.siteAddressIndex()].en.value + ',' : ''}
            <br />${self.observedSiteAddress().cities[self.siteAddressIndex()].en.value},
            <br />${self.observedSiteAddress().counties[self.siteAddressIndex()].en.value},
            <br />${self.observedSiteAddress().postcodes[self.siteAddressIndex()].en.value}`
          }
          return ''
          
        },
      })
    }

    // county = ko.computed({
    //   read: function() {
    //     console.log("county comp")
    //     self.reportVals.county = self.siteAddress.counties ? self.siteAddress.counties[self.siteAddressIndex()] : ''
    // },
    // })


    this.resourceLoading = ko.observable(false);
    this.relatedResourceLoading = ko.observable(false);
    this.geometry = false;

    var getNodeValues = function(tiles, nodeId) {
      var values = [];
      tiles.forEach((tile) => {
        if (tile.data[nodeId]){
          values.push(tile.data[nodeId])
        }
          });
      ;
      return values;
  };

    this.relatedResources.subscribe((val) => {
      console.log('revalu', val)
      val.related_resources.forEach(related_resource => {
        if (related_resource.graph_id === "d4a88461-5463-11e9-90d9-000d3ab1e588") {
          // company / organisation
        }
        if (related_resource.graph_id === "22477f01-1a44-11e9-b0a9-000d3ab1e588") {
          // people
        }
        if (related_resource.graph_id === "b9e0701e-5463-11e9-b5f5-000d3ab1e588") {
          // activity
          externalRefs = getNodeValues(related_resource.tiles, '589d4dc7-edf9-11eb-9856-a87eeabdefba')
          externalRefSources = getNodeValues(related_resource.tiles, '589d4dcd-edf9-11eb-8a7d-a87eeabdefba')
          externalRefNotes = getNodeValues(related_resource.tiles, '589d4dc9-edf9-11eb-9018-a87eeabdefba')

          this.siteAddress.buildingNames = getNodeValues(related_resource.tiles, 'a541e029-f121-11eb-802c-a87eeabdefba')
          this.siteAddress.buildingNumbers = getNodeValues(related_resource.tiles, 'a541b925-f121-11eb-9264-a87eeabdefba')
          this.siteAddress.streets = getNodeValues(related_resource.tiles, 'a541b927-f121-11eb-8377-a87eeabdefba')
          this.siteAddress.subStreetNumbers = getNodeValues(related_resource.tiles, 'a541b922-f121-11eb-9fa2-a87eeabdefba')
          this.siteAddress.subStreets = getNodeValues(related_resource.tiles, 'a541e027-f121-11eb-ba26-a87eeabdefba')
          this.siteAddress.counties = getNodeValues(related_resource.tiles, 'a541e034-f121-11eb-8803-a87eeabdefba')
          this.siteAddress.postcodes = getNodeValues(related_resource.tiles, 'a541e025-f121-11eb-8212-a87eeabdefba')
          this.siteAddress.cities = getNodeValues(related_resource.tiles, 'a541e023-f121-11eb-b770-a87eeabdefba')

        }
        if (related_resource.graph_id === "a535a235-8481-11ea-a6b9-f875a44e0e11") {
          // digital objects
        }

      })
      for (const index in externalRefSources) {
        // currently using HER ref as bfile number. Need to change when we have Kanika's concepts.
        if (externalRefSources[index] === "19afd557-cc21-44b4-b1df-f32568181b2c") {
          this.reportVals.bFileNumber = externalRefs[index].en.value
        }
        if (externalRefSources[index] === "9a383c95-b795-4d76-957a-39f84bcee49e") {
          this.reportVals.licenseNumber = externalRefs[index].en.value
        }
        if (externalRefSources[index] === "df585888-b45c-4f48-99d1-4cb3432855d5") {
          this.reportVals.assetNames.push(externalRefs[index].en.value)
          this.reportVals.assetNotes.push(externalRefNotes[index])
        }
        if (externalRefSources[index] === "c14def6d-4713-465f-9119-bc33f0d6e8b3") {
          this.reportVals.wreckNames.push(externalRefs[index].en.value)
          this.reportVals.wreckNotes.push(externalRefNotes[index])
        }
      }
      console.log(this.siteAddress)
      this.observedSiteAddress(this.siteAddress)
    }, this)

    this.resourceData.subscribe((val) => {
      console.log('valueeeeee: ', val);
      this.displayName = val['displayname'] || 'Unnamed';
      this.reportVals.applicationId = {
          name: 'Application ID',
          value: this.getResourceValue(val.resource, ['System Reference Numbers', 'UUID', 'ResourceID', '@value'])
        },
        // address: {
        //   name: 'Address',
        //   value: this.getResourceValue(val.resource, ['license Area', 'Geometry', 'Related Application Area', '@value'])
        // },
        // date: {
        //   name: 'Date',
        //   value: this.getResourceValue(val.resource, ['license Dates', 'Log Date', '@value'])
        // },
        // licenseeName: {
        //   name: "Licencee's Name",
        //   value: this.getResourceValue(val.resource, ["Contacts", "Owners", "Owner", '@value'])
        // },

        this.reportVals.siteName = {
          name: 'Site Name',
          value: this.getResourceValue(val.resource, ['Associated Activities', '@value'])
        },
        // submissionDetails: {
        //   name: 'Submission Details',
        //   value: this.getResourceValue(val.resource, ['Submission Details', '@value'])
        // },

        // gridRef: {
        //   name: 'Grid Reference',
        //   value: this.getResourceValue(val.resource, ['Grid Reference', '@value'])
        // },
        // planningRef: {
        //   name: 'Planning Reference',
        //   value: this.getResourceValue(val.resource, ['Planning Reference', '@value'])
        // },
        // applicantInformation: {
        //   name: 'Applicant Information',
        //   value: this.getResourceValue(val.resource, ['Contacts', 'Applicants', 'Applicant', '@value'])
        // },
        // status: {
        //   name: 'Status',
        //   value: this.getResourceValue(val.resource, ['Advice'])[0]['Advice Type']['@value']
        // }

        this.reportVals.inspector = this.getResourceValue(val.resource, ["Decision", "Decision Assignment", "Decision Made By", "@value"])
        this.reportVals.decisionDate = this.getResourceValue(val.resource, ["Decision", "Decision Assignment", "Decision Time Span", "Decision Date", "@value"])

      console.log('report vals: ', this.reportVals);

      this.loading(false);
    }, this);
  }

  ko.components.register('license-final-step', {
    viewModel: viewModel,
    template: licenseFinalStepTemplate
  });
  return viewModel;
});
