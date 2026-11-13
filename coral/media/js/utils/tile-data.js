import _ from 'underscore';
import arches from 'arches';

// Untouched fields are null; cleared ones come back as '', [] or an empty text value.
const isBlank = (value) =>
  value === null || value === undefined || value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  value?.[arches.activeLanguage]?.value === '';

const normalise = (value) => (isBlank(value) ? null : value);

/** Whether two tile data objects match, counting every blank as the same. */
export default (a, b) => _.isEqual(_.mapObject(a, normalise), _.mapObject(b, normalise));
