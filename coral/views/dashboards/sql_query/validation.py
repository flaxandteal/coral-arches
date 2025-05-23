import re

def validate_arguments(
    sort_by,
    count,
    filter,
    reverse,
    limit,
    offset,
    config,
):
    # Validate sort_by
    sort_options = config.get('sort_options', {})
    if sort_options and sort_by not in sort_options:
        raise ValueError(f"Invalid sort_by: {sort_by}")

    # Validate reverse
    if not isinstance(reverse, bool):
        raise ValueError("reverse must be a boolean")
    
    # Validate count
    if not isinstance(count, bool):
        raise ValueError("count must be a boolean")

    # Validate limit and offset
    if not (isinstance(limit, int) and 0 < limit <= 100):
        raise ValueError("limit must be an integer between 1 and 100")
    if not (isinstance(offset, int) and offset >= 0):
        raise ValueError("offset must be a non-negative integer")

    # Validate filter
    if not isinstance(filter, dict):
        raise ValueError("filter must be a dict")
    filter_id = filter.get('id', 'all')
    filter_type = filter.get('type', 'all')

    extra_filters = config.get('extra_filters', {})
    allowed_filter_types = set(['all', 'default']) | set(extra_filters.keys())
    if filter_type not in allowed_filter_types:
        raise ValueError(f"Invalid filter type: {filter_type}")

    uuid_regex = re.compile(r'^[a-f0-9\-]{36}$', re.IGNORECASE)
    safe_string_regex = re.compile(r'^[\w\-\/]+$')  # allows alphanum, _, -, /

    def is_safe_filter_id(filter_id):
        if uuid_regex.match(str(filter_id)):
            return True
        if safe_string_regex.match(str(filter_id)):
            return True
        return False

    if not is_safe_filter_id(filter_id):
        raise ValueError("Invalid filter id")
