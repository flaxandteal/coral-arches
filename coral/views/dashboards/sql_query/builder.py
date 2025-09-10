from .validation import validate_arguments

def build_query(
    sort_by,
    count=False,
    filter={'id':'all', 'type': 'all'},
    reverse=False,
    limit=8,
    offset=0,
    config=None,
):
    validate_arguments(
        sort_by,
        count,
        filter,
        reverse,
        limit,
        offset,
        config,
    )
    return _build_query(
        sort_by,
        count,
        filter,
        reverse,
        limit,
        offset,
        config
    )

def _build_query(
    sort_by,
    count,
    filter,
    reverse,
    limit,
    offset,
    config
):
    # config is expected to be a dict with keys: base_sort, sort_options, base_filters, extra_filters
    base_sort = config['base_sort']
    sort_options = config['sort_options']
    base_filters = config['base_filters']
    extra_filters = config['extra_filters']

    ref_paths = sort_options.get(sort_by, None)
    order_direction = "DESC" if reverse else "ASC"

    def build_subquery(model_type, filter=None):
        nodegroupid = ref_paths[model_type]['nodegroupid']
        sql_path = ref_paths[model_type]['sql']
        base_filter = base_filters[model_type]
        if filter and filter['type'] in extra_filters.keys():
            extra_template = extra_filters[filter['type']][model_type]
            if not extra_template:
                return None
            filter_value = filter['id']
            extra = extra_filters[filter['type']][model_type].format(filter_value=filter_value)  
        else:
            extra = None          

        full_filter = base_filter

        if extra:
            full_filter = f"({base_filter}) AND ({extra})"

        base_nodegroupid = base_sort[model_type]['nodegroupid']

        if not nodegroupid or not sql_path:
            # No join, just select NULL for sort_value
            return f"""
            SELECT DISTINCT ON (t_fixed.resourceinstanceid)
                t_fixed.resourceinstanceid,
                NULL AS sort_value,
                '{model_type}' AS type
            FROM tiles t_fixed
            WHERE t_fixed.nodegroupid = '{base_nodegroupid}'
            AND {full_filter}
            """
        else:
            return f"""
            SELECT DISTINCT ON (t_fixed.resourceinstanceid)
                t_fixed.resourceinstanceid,
                t_sort.tiledata -> {sql_path} AS sort_value,
                '{model_type}' AS type
            FROM tiles t_fixed
            LEFT JOIN tiles t_sort
            ON t_fixed.resourceinstanceid = t_sort.resourceinstanceid
            AND t_sort.nodegroupid = '{nodegroupid}'
            WHERE t_fixed.nodegroupid = '{base_nodegroupid}'
            AND {full_filter}
            """

    if filter['id'] in base_sort.keys():
        subqueries = [ build_subquery(filter['id']) ]
    else:
        model_types = list(base_sort.keys())
        subqueries = [build_subquery(model, filter) for model in model_types]

    if count is True:
        count_query = f"""
        SELECT type, COUNT(*) AS count FROM (
            {' UNION ALL '.join([q for q in subqueries if q])}
        ) AS main
        GROUP BY type
        """
        return count_query

    full_query = f"""
    SELECT * FROM (
        {' UNION ALL '.join([q for q in subqueries if q])}
    ) AS main
    ORDER BY sort_value IS NULL, sort_value {order_direction}
    LIMIT {limit} OFFSET {offset};
    """

    return full_query