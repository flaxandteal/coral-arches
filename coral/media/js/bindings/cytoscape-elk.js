define([
    'knockout',
    'underscore',
    'cytoscape',
    'cytoscape-elk'
], function(ko, _, cytoscape, elk) {
    cytoscape.use(elk);
    ko.bindingHandlers.cytoscape = {
        init: function(element, valueAccessor) {
            var defaults = {
                container: element
            };
            var config = ko.unwrap(valueAccessor()).config || {};

            var viz = cytoscape(
                _.defaults(ko.unwrap(config), defaults)
            );

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                viz.destroy();
            }, this);

            if (typeof ko.unwrap(valueAccessor()).afterRender === 'function') {
                ko.unwrap(valueAccessor()).afterRender(viz);
            }
        },
    };
    return ko.bindingHandlers.cytoscape;
});
