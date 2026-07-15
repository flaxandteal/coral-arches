import ko from 'knockout';
import BaseManagerView from 'views/base-manager';

var helpViewModel = BaseManagerView.extend({
    initialize: function(options) {
        BaseManagerView.prototype.initialize.call(this, options);
    }
});

export default new helpViewModel();
