/*!
 * Vanilla cookie helper used in place of the legacy js-cookie 2.1.1 shim.
 *
 * Returns a Cookies-like object with .get(name), .set(name, value, opts), and
 * .remove(name). The previous bundled shim was occasionally returning the
 * wrong value for the csrftoken cookie (header length neither 32 nor 64),
 * which Django then rejected with REASON_INCORRECT_LENGTH. This module
 * resolves cookie values directly from document.cookie, scanning *every*
 * matching entry and returning the longest non-empty value (so a stale
 * empty-string duplicate cookie does not shadow the real one).
 */

function _readAll(name) {
    if (typeof document === 'undefined' || !document.cookie) {
        return [];
    }
    const target = encodeURIComponent(String(name));
    const matches = [];
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i++) {
        const raw = parts[i];
        const eqIdx = raw.indexOf('=');
        if (eqIdx < 0) continue;
        const rawKey = raw.slice(0, eqIdx).trim();
        if (rawKey !== name && rawKey !== target) continue;
        let value = raw.slice(eqIdx + 1).trim();
        if (value.length >= 2 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.slice(1, -1);
        }
        try { value = decodeURIComponent(value); } catch (e) { /* keep raw */ }
        matches.push(value);
    }
    return matches;
}

function get(name) {
    if (name == null) {
        const out = {};
        if (typeof document === 'undefined' || !document.cookie) return out;
        const parts = document.cookie.split(';');
        for (let i = 0; i < parts.length; i++) {
            const raw = parts[i];
            const eqIdx = raw.indexOf('=');
            if (eqIdx < 0) continue;
            const k = raw.slice(0, eqIdx).trim();
            let v = raw.slice(eqIdx + 1).trim();
            if (v.length >= 2 && v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') {
                v = v.slice(1, -1);
            }
            try { v = decodeURIComponent(v); } catch (e) { /* keep raw */ }
            let kDecoded = k;
            try { kDecoded = decodeURIComponent(k); } catch (e) { /* keep raw */ }
            out[kDecoded] = v;
        }
        return out;
    }
    const matches = _readAll(name);
    if (matches.length === 0) return undefined;
    let best = matches[0];
    for (let i = 1; i < matches.length; i++) {
        if (matches[i].length > best.length) best = matches[i];
    }
    return best;
}

function set(name, value, attributes) {
    if (typeof document === 'undefined') return;
    attributes = Object.assign({ path: '/' }, attributes || {});
    if (typeof attributes.expires === 'number') {
        const d = new Date();
        d.setTime(d.getTime() + attributes.expires * 864e5);
        attributes.expires = d;
    }
    let serialised = encodeURIComponent(String(name)) + '=' + encodeURIComponent(String(value));
    if (attributes.expires instanceof Date) {
        serialised += '; expires=' + attributes.expires.toUTCString();
    }
    if (attributes.path) serialised += '; path=' + attributes.path;
    if (attributes.domain) serialised += '; domain=' + attributes.domain;
    if (attributes.secure) serialised += '; secure';
    if (attributes.samesite) serialised += '; samesite=' + attributes.samesite;
    document.cookie = serialised;
}

function remove(name, attributes) {
    set(name, '', Object.assign({}, attributes || {}, { expires: -1 }));
}

const Cookies = { get, set, remove };
Cookies.getJSON = function(name) {
    const v = get(name);
    if (v == null) return v;
    try { return JSON.parse(v); } catch (e) { return v; }
};

export default Cookies;
