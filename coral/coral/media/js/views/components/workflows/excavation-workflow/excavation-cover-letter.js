define([
    'knockout',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/excavation-workflow/excavation-cover-letter.htm'
    
  ], function (ko, SummaryStep, excavationCoverTemplate) {
    function viewModel(params) {
        console.log(this)
      SummaryStep.apply(this, [params]);
      console.log(this)
      console.log(SummaryStep)
  
      const self = this;
      this.resourceid = params.resourceid;
  
      console.log('loaded excavationCoverTemplate');
  
      this.resourceLoading = ko.observable(false);
      this.relatedResourceLoading = ko.observable(false);
      this.geometry = false;
  
      this.resourceData.subscribe((val) => {
        console.log('valueeeeee: ', val);
        this.displayName = val['displayname'] || 'Unnamed';
        this.reportVals = {
          applicationId: {
            name: 'Application ID',
            value: this.getResourceValue(val.resource, ['Application ID', '@value'])
          },
          address: {
            name: 'Address',
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
  
        console.log('report vals: ', this.reportVals);
  
        this.loading(false);
      }, this);
    }
  
    ko.components.register('excavation-cover-letter', {
      viewModel: viewModel,
      template: excavationCoverTemplate
    });
    return viewModel;
  });