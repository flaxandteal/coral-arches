define([
    'knockout',
    'arches',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/license-workflow/license-cover-letter.htm'
    
  ], function (ko, arches, SummaryStep, licenseCoverTemplate) {
    function viewModel(params) {
      SummaryStep.apply(this, [params]);
      console.log("The paramaters", params)
      console.log(SummaryStep)

      
    }
  
    ko.components.register('license-cover-letter', {
      viewModel: viewModel,
      template: licenseCoverTemplate
    });
    return viewModel;
  });