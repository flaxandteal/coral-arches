define([
    'knockout',
    'viewmodels/card-component',
    'templates/views/components/cards/default.htm',
], function(ko, CardViewModel, defaultCardTemplate) {

    function viewmodel(params) {
        CardViewModel.apply(this, [params]);

        this.getTableData = function(widgets, tiles) {
            var tileObjArr = [[]];
            var tilesArr = ko.unwrap(tiles);
            var widgetsArr = ko.unwrap(widgets);
            var widget = null, tile = null;
            
            for(var i = 0, j = 0; i < tilesArr.length; j++) {
                if (!tileObjArr[i]) { tileObjArr[i] = []; }
                widget = widgetsArr[j], tile = tilesArr[i];
                if (tile) {
                    tileObjArr[i][j] = {
                        name: widget.widgetLookup[widget.widget_id()].name,
                        node: widget.node,
                        config: widget.config,
                        label: widget.label,
                        value: tile.data[widget.node_id()],
                        tile: tile
                    };
                    if(i == tilesArr.length - 1) { i++; }
                }
                if(j >= 1) { 
                    j = -1;
                    i++;
                }
            }
            return tileObjArr;
        };

        this.formatSize = function(size) {
            var bytes = size;
            if(bytes == 0) return '0 Byte';
            var k = 1024;
            var dm = 2;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return (parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i]);
        };  

        //if multi tile check mandatory fields and disable add
        if(params.form?.componentData?.tilesManaged === 'many'){
            this.mandatoryNodes = ko.observableArray([])
            this.currentValues = ko.observable({})

            // this has been removed as it was causing issues with hidden nodes
            // do a node lookup to check for isrequired on the model config
            // if(params.form.nodeLookup){
            //     for(const [key, node] of Object.entries(params.form.nodeLookup)){
            //         if(node?.isrequired() === true){
            //             if(!this.tile.data[key]){
            //                 continue
            //             }
            //             this.mandatoryNodes.push(key)
            //         }
            //     }   
            // }

            // check workflow config for isrequired attributes also
            if(params.nodeOptions){
                for(const [key, node] of Object.entries(params.nodeOptions)){
                    for(const value of Object.values(node)){
                        if(value?.isrequired === true){
                            this.mandatoryNodes.push(key)
                        }
                    }   
                }
            }


            if(this.mandatoryNodes().length > 0){
                params.form.disableAdd(true)
            }

            this.mandatoryNodes().forEach((node) => {
                // set null values for mandatory nodes
                this.currentValues()[node] = null
                // subscribe to changes for each node and update the values
                this.tile.data[node].subscribe((newValue) => {
                    const currentValues = this.currentValues();
                    currentValues[node] = newValue;
                    this.currentValues(currentValues);
                })
            })
            
            this.hasNullValue = (obj) => {
                // recursively check values, allows for strings but not currently arrays
                if (obj === null || obj === ""){
                    return true;
                }
                if (typeof obj === 'object'){
                    return Object.values(obj).some(value => this.hasNullValue(value));
                }
                return false
            }

            this.checkNullValues = ko.computed(() => {
                const values = this.currentValues();
                params.form.disableAdd(this.hasNullValue(values))
            });
        }        
    }

    return ko.components.register('default-card', {
        viewModel: viewmodel,
        template: defaultCardTemplate
    });
});