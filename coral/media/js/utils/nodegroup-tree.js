/**
 * Walk up to the root of a nodegroup's tree.
 *
 * Workflow components need the top card their own card hangs under, so they can
 * build that one branch instead of every top card in the graph.
 *
 * @param {object} nodegroupLookup - nodegroupid -> nodegroup, as served by /cards
 * @param {string} nodegroupid
 * @returns {string} the root nodegroupid, or nodegroupid itself if it is a root
 *   or is absent from the lookup (an orphan card, which /cards does serve)
 */
export default function findRootNodegroupId(nodegroupLookup, nodegroupid) {
    var rootNodegroupId = nodegroupid;
    var nodegroup = nodegroupLookup[rootNodegroupId];
    var seen = {};
    while (nodegroup && nodegroup.parentnodegroup_id && !seen[rootNodegroupId]) {
        seen[rootNodegroupId] = true;
        rootNodegroupId = nodegroup.parentnodegroup_id;
        nodegroup = nodegroupLookup[rootNodegroupId];
    }
    return rootNodegroupId;
}
