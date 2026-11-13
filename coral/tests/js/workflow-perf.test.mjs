/*
    Plain node, no framework: `node coral/tests/js/workflow-perf.test.mjs`.

    Covers the two coral-owned utils the workflow clones call into. Deliberately
    not covering utils/workflow-card-data.js — it imports arches, jquery and
    models/graph through webpack aliases, so it cannot run outside a bundle; its
    one piece of real logic lives in nodegroup-tree instead.
*/
import assert from 'node:assert/strict';
import findRootNodegroupId from '../../media/js/utils/nodegroup-tree.js';
import sharedRequest from '../../media/js/utils/shared-request.js';

var ng = function(id, parent) { return { nodegroupid: id, parentnodegroup_id: parent }; };
var lookup = function(groups) {
    return groups.reduce(function(acc, g) { acc[g.nodegroupid] = g; return acc; }, {});
};

// --- findRootNodegroupId -------------------------------------------------

// a root nodegroup is its own root
assert.equal(findRootNodegroupId(lookup([ng('a', null)]), 'a'), 'a');

// a grandchild resolves to the top of its own branch, not a sibling branch's top
var tree = lookup([ng('a', null), ng('b', 'a'), ng('c', 'b'), ng('x', null), ng('y', 'x')]);
assert.equal(findRootNodegroupId(tree, 'c'), 'a');
assert.equal(findRootNodegroupId(tree, 'y'), 'x');

// an orphan card's nodegroup is absent from /cards nodegroups; it is its own top card
assert.equal(findRootNodegroupId(tree, 'missing'), 'missing');

// a parent pointer to a nodegroup that isn't served stops there rather than returning undefined
assert.equal(findRootNodegroupId(lookup([ng('b', 'a')]), 'b'), 'a');

// a cycle terminates instead of hanging the step
assert.ok(['a', 'b'].includes(findRootNodegroupId(lookup([ng('a', 'b'), ng('b', 'a')]), 'a')));

// --- sharedRequest -------------------------------------------------------

var settle;
var calls = 0;
var make = function() { calls += 1; return new Promise(function(res) { settle = res; }); };

// callers in the same tick share one request — the whole point
var a = sharedRequest('k', make);
var b = sharedRequest('k', make);
assert.equal(calls, 1);
assert.equal(a, b);

// a different key is a different request
sharedRequest('other', function() { return Promise.resolve('x'); });
assert.equal(calls, 1);

settle('payload');
assert.equal(await a, 'payload');
assert.equal(await b, 'payload');

// once settled the entry is gone, so the next caller goes to the network again
// (no caching across a save)
sharedRequest('k', make);
assert.equal(calls, 2);
settle('second');

// a rejection is not remembered — the next caller retries rather than inheriting it
var boom = sharedRequest('fails', function() { return Promise.reject(new Error('nope')); });
await assert.rejects(boom, /nope/);
var retried = sharedRequest('fails', function() { return Promise.resolve('recovered'); });
assert.equal(await retried, 'recovered');

console.log('workflow-perf: all assertions passed');
