define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/excavation-workflow/excavation-final-step.htm'
], function (ko, SummaryStep, excavationFinalStepTemplate) {
  function viewModel(params) {
    SummaryStep.apply(this, [params]);
    console.log(this)
    console.log(SummaryStep)

    const self = this;
    this.resourceid = params.resourceid;

    console.log('loaded excavationFinalStepTemplate');

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
          value: this.getResourceValue(val.resource, ['Address', '@value'])
        },
        bFilecmNumber: {
          name: 'B File/CM Number',
          value: this.getResourceValue(val.resource, ['B File/CM Number', '@value'])
        },
        date: {
          name: 'Date',
          value: this.getResourceValue(val.resource, ['Excavation Dates', '@value'])
        },
        licenseeName: {
          name: "Licencee's Name",
          value: this.getResourceValue(val.resource, ["Licencee's Name", '@value'])
        },
        licenseNumber: {
          name: 'License Number',
          value: this.getResourceValue(val.resource, ['License Number', '@value'])
        },
        siteName: {
          name: 'Site Name',
          value: this.getResourceValue(val.resource, ['Site Name', '@value'])
        },
        submissionDetails: {
          name: 'Submission Details',
          value: this.getResourceValue(val.resource, ['Submission Details', '@value'])
        },
        county: {
          name: 'County',
          value: this.getResourceValue(val.resource, ['"Localities/Administrative Areas', '@value'])
        },
        bFileCmNumber: {
          name: 'B File/CM Number',
          value: this.getResourceValue(val.resource, ['B File/CM Number', '@value'])
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
          value: this.getResourceValue(val.resource, ['Applicant Information', '@value'])
        },
        status: {
          name: 'Status',
          value: this.getResourceValue(val.resource, ['Status', '@value'])
        }
      };

      console.log('report vals: ', this.reportVals);

      this.loading(false);
    }, this);
  }

  ko.components.register('excavation-final-step', {
    viewModel: viewModel,
    template: excavationFinalStepTemplate
  });
  return viewModel;
});
