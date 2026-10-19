/* Plain node: `node coral/tests/js/tile-data.test.mjs`. */
import assert from 'node:assert/strict';
import sameTileData from '../../media/js/utils/tile-data.js';

var i18n = function(value, direction) {
    return { en: { value: value, direction: direction || 'ltr' } };
};

assert.ok(sameTileData({ n: null }, { n: i18n('') }), 'cleared i18n string equals untouched null');
assert.ok(sameTileData({ n: null }, { n: [] }), 'empty list equals null');
assert.ok(sameTileData({ n: null }, {}), 'missing key equals null');
assert.ok(!sameTileData({ n: null }, { n: 0 }), '0 is a real value');
assert.ok(!sameTileData({ n: null }, { n: false }), 'false is a real value');
assert.ok(!sameTileData({ n: null }, { n: i18n('Barn') }), 'a real value differs');
assert.ok(!sameTileData({ n: i18n('') }, { n: { en: { value: '', direction: 'ltr' }, ga: { value: 'x', direction: 'ltr' } } }),
    'one non-empty language differs');
assert.ok(sameTileData({ n: i18n('Barn') }, { n: i18n('Barn') }), 'identical values are equal');
assert.ok(!sameTileData({ n: ['a'] }, { n: ['a', 'b'] }), 'different lists differ');
console.log('tile-data: ok');
