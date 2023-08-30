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

      /**
      * INSERT INTO public.nodes VALUES ('d45c7d17-857a-4a51-b4db-e624ba52a4e0', 'Excavation Contact', NULL, false, 'http://www.cidoc-crm.org/cidoc-crm/E55_Type', 'domain-value', 'eca88468-73c8-4784-9f22-be8766c13a1d', '{"options": [{"id": "dcaf8850-9cfc-44ea-9fd4-0ca419806e2b", "text": {"en": "Agent"}, "selected": false}, {"id": "d88aa873-848c-45cb-b967-4febe7397912", "text": {"en": "Owner"}, "selected": false}, {"id": "5cc97bfd-d76f-40fc-be60-fbb9dfb28fc4", "text": {"en": "Planning Officer"}, "selected": false}], "i18n_config": {"fn": "arches.app.datatypes.datatypes.DomainDataType"}}', '9c98720a-f58e-4d11-9a01-409b20e1386a', true, false, 0, NULL, false, 'consulting_contact', false);
      */
     const contact_nodes = {
      'dcaf8850-9cfc-44ea-9fd4-0ca419806e2b': '537be80b-e895-4a07-8324-b8c8cfadd798',
      'd88aa873-848c-45cb-b967-4febe7397912': 'b38560ef-9769-4a02-b9cb-74eac0432aa6',
      '5cc97bfd-d76f-40fc-be60-fbb9dfb28fc4': '89d3ef80-d67e-41ed-a1b7-1ce575f7f5d5',
     }
  
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
            self.area = area.report_json['Location Data'][0]
            console.log(self.area)
            this.address(
              `${self.area.Addresses['Building Name']['Building Name Value'] != '' ? self.area.Addresses['Building Name']['Building Name Value'] + ', <br />' : ''} 
              ${self.area.Addresses['Building Number']['Building Number Value']} ${self.area.Addresses['Street']['Street Value']}, 
              ${self.area.Addresses['Building Number Sub-Street']['Building Number Sub-Street Value'] != '' ? self.area.Addresses['Building Number Sub-Street']['Building Number Sub-Street Value'] + ', <br />' : ''}
              ${self.area.Addresses['Sub-Street ']['Sub-Street Value'] != '' ? self.area.Addresses['Sub-Street ']['Sub-Street Value'] + ', <br />' : ''}
              ${self.area.Addresses['Town or City']['Town or City Value']},
              <br />${self.area.Addresses['County']['County Value']},
              <br />${self.area.Addresses['Postcode']['Postcode Value']}`)
            console.log(self.address)
            this.loading(false);

        }
    };

    self.setSelectedAreaTile = async (val) => {
      if (val) {

        
          const response = await fetch(`${arches.urls.api_tiles(val)}?format=json`);
          area = await response.json()
          console.log("The contact node", contact_nodes[area.data['d45c7d17-857a-4a51-b4db-e624ba52a4e0']])
          self.areaid = area.data[contact_nodes[area.data['d45c7d17-857a-4a51-b4db-e624ba52a4e0']]]['0']['resourceId']
          console.log(self.areaid)
      }
  };
  this.resourceData.subscribe((val) => {
        self.setSelectedAreaTile(this.getResourceValue(val.resource, ['Contacts', 'Excavation Contact', '@tile_id'])).then(() => {
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
              value: this.getResourceValue(val.resource, ['System Reference Numbers', 'UUID', 'ResourceID', '@value'])
            },
            address: {
              name: 'Address',
              value: this.address
            },
            address_tile: {
              name: 'address_tile',
              value: this.getResourceValue(val.resource, ['Contacts', 'Excavation Contact', '@tile_id'])
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
            value: this.getResourceValue(val.resource, ['Excavation Area', 'Geometry', 'Excavation Location Descriptions', 'Excavation Location Description', '@value'])
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