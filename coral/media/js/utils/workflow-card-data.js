/*
    The expensive parts of building a workflow component, kept out of
    views/components/workflows/workflow-component-abstract.js because that file
    is a clone of the arches core module and has to be re-synced when core moves.
    Everything here is coral's own; the clone only calls into it.

    A coral step renders many components against ONE resource — its
    multi-nodegroup-per-step adaptation, which upstream workflows do not do — so
    every per-component cost is paid a dozen times over.
*/

import $ from 'jquery';
import arches from 'arches';
import GraphModel from 'models/graph';
import ProvisionalTileViewModel from 'viewmodels/provisional-tile';
import sharedRequest from 'utils/shared-request';
import findRootNodegroupId from 'utils/nodegroup-tree';

/* One GraphModel per card-data id, shared by every component built against it.
   Constructing one means a NodeModel per node in the whole graph — 762 for a
   heritage asset. Everything downstream only reads from it (nodes, nodegroups,
   datatypelookup), and it has no dispose method, so one instance serves all.
   ponytail: never evicted — one entry per resource visited, and a graph
   republished mid-session would be stale. Add eviction if either bites. */
var graphModels = {};

/**
 * The GraphModel for a /cards response, built once per card-data id.
 *
 * @param {string} id - resource or graph id the card data was fetched for
 * @param {object} data - a /cards response
 * @returns {GraphModel}
 */
export function getGraphModel(id, data) {
    if (!(id in graphModels)) {
        graphModels[id] = new GraphModel({
            data: {
                nodes: data.nodes,
                nodegroups: data.nodegroups,
                edges: []
            },
            datatypes: data.datatypes
        });
    }
    return graphModels[id];
}

/**
 * Card data for a component, fetched at most once per component.
 *
 * Components in the same step share the in-flight request — /cards runs a
 * permission check per collector node and serialises every card, node, widget
 * and tile for the graph, so one response instead of a dozen is the win.
 * Each caller gets its own copy because the caller mutates it building view
 * models.
 *
 * A component re-initializes on every step save even with nothing to save. Its
 * card structure cannot have changed, and its tiles cannot have either if it is
 * not dirty, so the first response is kept on the component and reused rather
 * than refetching ~1.1MB while the tile saves need the same single app process.
 *
 * @param {object} component - the workflow component, used as the cache owner
 * @param {string} id - resource or graph id
 * @returns {Promise<object>}
 */
export function cardDataFor(component, id) {
    if (component._pristineCardData) {
        return Promise.resolve(structuredClone(component._pristineCardData));
    }
    return sharedRequest('cards:' + id, function() {
        return $.getJSON(arches.urls.api_card + id);
    }).then(function(data) {
        component._pristineCardData = structuredClone(data);
        return structuredClone(data);
    });
}

/**
 * The top cards a component actually has to build.
 *
 * A component displays exactly one card, but CardViewModel recurses eagerly —
 * a child card per child nodegroup, a TileViewModel per existing tile, a widget
 * per node. Building every top card and then flattening the tree to find one
 * therefore materialised the entire resource in each component of the step.
 * The card we want hangs under exactly one top card, so return only that branch.
 *
 * @param {object} data - a /cards response
 * @param {string} [nodegroupid] - the component's target; defaults, as the
 *   arches core module does, to the first top card's nodegroup
 * @returns {{cards: object[], nodegroupid: string}} the top cards to build, and
 *   the resolved target nodegroup for a caller that had none
 */
export function selectTopCards(data, nodegroupid) {
    var nodegroupLookup = data.nodegroups.reduce(function(lookup, nodegroup) {
        lookup[nodegroup.nodegroupid] = nodegroup;
        return lookup;
    }, {});

    var topCards = data.cards.filter(function(card) {
        var nodegroup = nodegroupLookup[card.nodegroup_id];
        return !nodegroup || !nodegroup.parentnodegroup_id;
    });

    var targetNodegroupId = nodegroupid || (topCards.length ? topCards[0].nodegroup_id : undefined);
    var rootNodegroupId = findRootNodegroupId(nodegroupLookup, targetNodegroupId);

    return {
        cards: topCards.filter(function(card) {
            return card.nodegroup_id === rootNodegroupId;
        }),
        nodegroupid: targetNodegroupId
    };
}

/**
 * A ProvisionalTileViewModel that doesn't ask the server to name nobody.
 *
 * Core's updateProvisionalEdits calls getUserNames for every tile whether or not
 * it has provisional edits, so a tile with none still POSTs userids: "[]". One
 * of these is built per workflow component, so a step opened with a dozen of
 * them. Guarding the instance keeps the fix here instead of forking core's
 * viewmodel, and is a no-op whenever there are edits to resolve.
 *
 * Safe to apply after construction: the constructor's own
 * updateProvisionalEdits call passes the observable rather than the tile, so it
 * never reaches getUserNames — the real calls come from the subscription, which
 * only fires once a tile is set.
 *
 * @param {object} params - as ProvisionalTileViewModel takes them
 * @returns {ProvisionalTileViewModel}
 */
export function makeProvisionalTileViewModel(params) {
    var viewModel = new ProvisionalTileViewModel(params);
    var getUserNames = viewModel.getUserNames;

    viewModel.getUserNames = function(edits, users) {
        if (!users.length) { return; }
        return getUserNames.call(this, edits, users);
    };

    return viewModel;
}
