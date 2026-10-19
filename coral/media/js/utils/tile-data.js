function isBlank(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    if (typeof value !== 'object') {
        return false;
    }
    var keys = Object.keys(value);
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    // an i18n string: {lang: {value, direction}}
    return keys.every(function(key) {
        var entry = value[key];
        return entry !== null && typeof entry === 'object' && 'value' in entry && entry.value === '';
    });
}

/**
 * Whether two plain tile-data values are the same, counting every blank
 * (null, '', [], {}, an i18n string with only empty values) as equal.
 *
 * Core's tile dirty check is an exact string compare, so a cleared field
 * never goes back to untouched.
 */
export default function sameTileData(a, b) {
    if (isBlank(a) && isBlank(b)) {
        return true;
    }
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
        return a === b;
    }
    if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
    }
    if (Array.isArray(a)) {
        return a.length === b.length && a.every(function(item, i) {
            return sameTileData(item, b[i]);
        });
    }
    var keys = Object.keys(a).concat(Object.keys(b));
    return keys.every(function(key) {
        return sameTileData(a[key], b[key]);
    });
}
