/*
    Several coral view models are constructed in the same tick against the same
    resource — a workflow step builds a dozen components, each with its own
    widgets — and each used to issue its own copy of the same request. A plain
    cache does not help: it is only written when the first response lands, by
    which point every other caller has already missed it and gone to the network.

    What collapses the burst is sharing the in-flight promise, not the result.
*/

var inFlight = {};

/**
 * Run makeRequest, or join the one already running under this key.
 *
 * The entry is dropped once settled, so nothing is cached across a save and a
 * failed request is retried by the next caller rather than remembered.
 *
 * @param {string} key
 * @param {function} makeRequest - called only when nothing is in flight
 * @returns {Promise} the shared promise
 */
export default function sharedRequest(key, makeRequest) {
    if (!(key in inFlight)) {
        inFlight[key] = Promise.resolve(makeRequest()).finally(function() {
            delete inFlight[key];
        });
    }
    return inFlight[key];
}
