define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'templates/views/components/cards/default.htm',
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, componentTemplate) {
    function viewModel(params) {
;
    const ISSUE_DATE_NODE = params.issueDateNode;
    const DUE_DATE_UNTIL_NODE = params.dueDateNode;
    const DAYS_TO_ADD = params.daysToAdd;
    
    CardComponentViewModel.apply(this, [params]);

      if (this.tile.data[ISSUE_DATE_NODE] && ko.isObservable(this.tile.data[ISSUE_DATE_NODE])) {
        this.tile.data[ISSUE_DATE_NODE].subscribe(issueDate => {
          const dueDate = this.addDays(issueDate)
          this.tile.data[DUE_DATE_UNTIL_NODE](dueDate)
        })
      }      
      
      this.addDays = (dateString) => {
        const date = new Date(dateString);

        date.setDate(date.getDate() + DAYS_TO_ADD);
      
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  
    ko.components.register('update-dates', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
  