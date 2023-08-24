define([
    'knockout',
    'arches',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/excavation-workflow/excavation-cover-letter.htm'
    
  ], function (ko, arches, SummaryStep, excavationCoverTemplate) {
    function viewModel(params) {
        console.log(this)
      SummaryStep.apply(this, [params]);
      console.log("The paramaters", params)

      console.log(SummaryStep)
  
      const self = this;
      this.resourceid = params.resourceid;
  
      console.log('loaded excavationCoverTemplate');
  
      this.resourceLoading = ko.observable(false);
      this.relatedResourceLoading = ko.observable(false);
      this.address = ko.observable('')
      this.geometry = false;

      self.setSelectedArea = async (val) => {
        if (val) {

            const response = await fetch(`${arches.urls.api_resource_report(val)}?format=json`);
            area = await response.json()
            self.area = area.report_json
            console.log(self.area)
            this.address(
              `${self.area.Addresses[0]['Building Name']['Building Name Value'] != '' ? self.area.Addresses[0]['Building Name']['Building Name Value'] + ', <br />' : ''} 
              ${self.area.Addresses[0]['Building Number']['Building Number Value']} ${self.area.Addresses[0]['Street']['Street Value']}, 
              ${self.area.Addresses[0]['Building Number Sub-Street']['Building Number Sub-Street Value'] != '' ? self.area.Addresses[0]['Building Number Sub-Street']['Building Number Sub-Street Value'] + ', <br />' : ''}
              ${self.area.Addresses[0]['Sub-Street ']['Sub-Street Value'] != '' ? self.area.Addresses[0]['Sub-Street ']['Sub-Street Value'] + ', <br />' : ''}
              ${self.area.Addresses[0]['Town or City']['Town or City Value']},
              <br />${self.area.Addresses[0]['County']['County Value']},
              <br />${self.area.Addresses[0]['Postcode']['Postcode Value']}`)
            console.log(self.address)
            this.loading(false);

        }
    };

    self.setSelectedAreaTile = async (val) => {
      if (val) {

          const response = await fetch(`${arches.urls.api_tiles(val)}?format=json`);
          area = await response.json()
          self.areaid = area.data['fdb2403c-fd46-46cf-993e-fb8480ffbefd']['0']['resourceId']
          console.log(self.area)
      }
  };
  this.resourceData.subscribe((val) => {
        self.setSelectedAreaTile(this.getResourceValue(val.resource, ['Excavation Area', 'Geometry', 'Related Application Area', '@tile_id'])).then(() => {
          self.areaData = self.setSelectedArea(self.areaid)
          console.log(self.areaData)
          console.log('before then', this.address)
        }).then(() => {
          console.log('after then', this.address)
          console.log('valueeeeee: ', val);
          this.displayName = val['displayname'] || 'Unnamed';
          this.reportVals = {
            applicationId: {
              name: 'Application ID',
              value: this.getResourceValue(val.resource, ['Application ID', '@value'])
            },
            address: {
              name: 'Address',
              value: this.address
            },
            address_tile: {
              name: 'address_tile',
              value: this.getResourceValue(val.resource, ['Excavation Area', 'Geometry', 'Related Application Area', '@tile_id'])
            },
            areaName: {
              name: 'Area Name',
              value: this.getResourceValue(val.resource, ['Excavation Area', 'Geometry', 'Related Application Area', '@value'])
            },
          date: {
            name: 'Date',
            value: this.getResourceValue(val.resource, ['Excavation Dates', 'Log Date', '@value'])
          },
          licenseeName: {
            name: "Licencee's Name",
            value: this.getResourceValue(val.resource, ["Contacts", "Owners", "Owner", '@value'])
          },
          licenseNumber: {
            name: 'License Number',
            value: this.getResourceValue(val.resource, ['Excavation Names', 'Excavation Name', '@value'])
          },
          siteName: {
            name: 'Site Name',
            value: this.getResourceValue(val.resource, ['Excavation Area', 'Geometry', 'Related Application Area', '@value'])
          },
          submissionDetails: {
            name: 'Submission Details',
            value: this.getResourceValue(val.resource, ['Submission Details', '@value'])
          },
          county: {
            name: 'County',
            value: this.getResourceValue(val.resource, ['Localities/Administrative Areas', 'Area Names', 'Area Name', '@value'])
          },
          bFileCmNumber: {
            name: 'B File/CM Number',
            value: this.getResourceValue(val.resource, ['References'])[0]['Agency Identifier']['Reference']['@value']
          },
          gridRef: {
            name: 'Grid Reference',
            value: this.getResourceValue(val.resource, ['Grid Reference', '@value'])
          },
          planningRef: {
            name: 'Planning Reference',
            value: this.getResourceValue(val.resource, ['Planning Reference', '@value'])
          },
          applicantInformation: {
            name: 'Applicant Information',
            value: this.getResourceValue(val.resource, ['Contacts', 'Applicants', 'Applicant', '@value'])
          },
          status: {
            name: 'Status',
            value: this.getResourceValue(val.resource, ['Advice'])[0]['Advice Type']['@value']
          },
          decisionBy: {
            name: 'Decision By',
            value: this.getResourceValue(val.resource, ['Advice'])[0]['Advice Assignment']['Advice applied by']['@value']
          }
        };
        
        
        
        console.log(this.address)
        console.log('report vals: ', this.reportVals);
      })
  
      }, this);
    }
  
    ko.components.register('excavation-cover-letter', {
      viewModel: viewModel,
      template: excavationCoverTemplate
    });
    return viewModel;
  });