import ko from 'knockout';
import CardViewModel from 'viewmodels/card-component';
import userAccountCardTemplate from 'templates/views/components/cards/user_account.htm';

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

}

export default ko.components.register('user-account-card', {
        viewModel: viewmodel,
        template: userAccountCardTemplate
    });
