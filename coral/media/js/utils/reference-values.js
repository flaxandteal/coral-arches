/**
 * Read controlled-list selections out of a `reference` node value.
 *
 * The v8 conversion turned coral's domain-value and concept nodes into `reference`, whose
 * value is a list of `{ uri, list_id, labels: [{ value, list_item_id }] }`. The pre-v8
 * `tile.data[node]() === '<option id>'` comparison therefore can never match.
 *
 * The shape varies by where you read it: a widget writes the full array, a tile saved
 * before the migration still holds the bare option id, and some paths hand back the list
 * item id on its own. All three are accepted here so a caller never has to care.
 */

/** Every controlled-list item id selected in a reference value. */
export const selectedListItemIds = (value) => {
  if (!value) return [];

  // A pre-migration tile, or a path that already resolved to the bare id.
  if (typeof value === 'string') return [value];

  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      // Every label in one entry carries the same list_item_id, so the first is enough.
      return entry?.labels?.[0]?.list_item_id ?? null;
    })
    .filter(Boolean);
};

/** Whether a reference value holds this controlled-list item. */
export const hasListItem = (value, listItemId) =>
  selectedListItemIds(value).includes(listItemId);

/** The one item id in a single-select reference value, or null. */
export const singleListItemId = (value) => selectedListItemIds(value)[0] ?? null;

/** Map a reference value onto a lookup keyed by list item id. */
export const lookupByListItem = (value, lookup, fallback = undefined) => {
  const found = selectedListItemIds(value).find((id) => id in lookup);
  return found === undefined ? fallback : lookup[found];
};

const referenceValueRequests = {};

/**
 * Tile value for a controlled-list selection, resolved from its item id.
 *
 * A reference value carries the item's uri and label rows, so it cannot be built from the
 * id alone; the server resolves it through the datatype. Null when the id names no item.
 */
export const referenceValue = (listItemId) => {
  if (!(listItemId in referenceValueRequests)) {
    referenceValueRequests[listItemId] = fetch(`/reference-value/${listItemId}`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }
  return referenceValueRequests[listItemId];
};

/**
 * Tile data for a workflow step's `prefilledNodes`, keyed by node id.
 *
 * Prefills are written as bare ids. That is still the value a non-reference node wants, but
 * a reference node needs the resolved value, so ids that name a list item are expanded.
 */
export const resolvePrefilledNodes = async (prefilledNodes) => {
  const resolved = {};
  await Promise.all(
    (prefilledNodes || []).map(async ([nodeId, value]) => {
      const reference = typeof value === 'string' ? await referenceValue(value) : null;
      resolved[nodeId] = reference ?? value;
    })
  );
  return resolved;
};
