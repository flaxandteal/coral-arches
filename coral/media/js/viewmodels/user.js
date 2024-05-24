define([
    'underscore',
    'knockout',
    'jquery',
    'arches',
    'viewmodels/widget',
], function(_, ko, $, arches, WidgetViewModel) {
    var UserSelectViewModel = function(params) {
        var self = this;
        params.configKeys = ['placeholder','displayOnlySelectedNode'];
        this.multiple = params.multiple || false;
         

        WidgetViewModel.apply(this, [params]);
        this.users = ko.observableArray();

        this.updateUsers = function() {
            //var nodeid = params.node.config.nodeid();
            //var url = this.url();
            //if (nodeid && url) {
                $.ajax({
                    dataType: "json",
                    //url: url,
                    url: arches.urls.get_user_details,
                    data: {
                        fullDetails: false,
                        withGroups: false
                    },
                    success: function(data) {
                        self.users(data.identities);
                    },
                    error: function(err) {
                        console.log(err, 'unable to fetch users');
                    }
                });
            //}
        };

        this.updateUsers();

        this.toggleDisplayOnlySelected = function(){
            this.displayOnlySelectedNode(!this.displayOnlySelectedNode());
        };

        this.getSelectedDisplayValue = function() {
            var value = self.value();
            var user = _.find(self.users(), function(user) {
                return user.id == value;
            });

            if (user) {
                return user.name;
            }
        };
        this.displayValue = ko.computed(function() {
            var displayValue = this.getSelectedDisplayValue();
            return displayValue;
        }, this);

        this.select2Config = {
            value: this.value,
            clickBubble: true,
            multiple: this.multiple,
            placeholder: this.placeholder,
            allowClear: true,
            ajax: {
                dataType: "json",
                url: arches.urls.get_user_details,
                // url: self.url(),
                data: {
                    fullDetails: false,
                    withGroups: false
                },
                processResults: function(data) {
                    var options = [];
                    data.identities.forEach(function(user) {
                        options.push(user);
                    });
                    return { results: options };
                },
                success: function(data) {
                    self.users(data.identities);
                    return data;
                },
                error: function(err) {
                    console.log(err, 'unable to fetch users');
                }
            },
            initSelection: function(element, callback) {
                var id = $(element).val();
                var users = self.users();
                
                // fixes #10027 where inputted values will be reset after navigating away  
                if (self.value()) {
                    id = self.value();
                }
                
                if (id !== "") {
                    var setSelection = function(users, callback)   {
                        var selection =  _.find(users, function(user) {
                            return user.id === id;
                        });
                        if (selection) {
                            callback(selection);
                        }
                    };
                    if (users.length === 0)   {
                        var subscription = self.users.subscribe(function(users) {
                            setSelection(users, callback);
                            subscription.dispose();
                        });
                    } else {
                        setSelection(users, callback);
                    }
                }
            },
            escapeMarkup: function(m) { return m; },
            templateResult: function(user) {
                return user.name;
            },
            templateSelection: function(user) {
                return user.name;
            }
        };
    };

    return UserSelectViewModel;
});
