def build_query(sort_by, count=False, reverse=False, limit=8, offset=0):

    base_sort = {
        'Monument': {
            'sql': "'325a430a-efe4-11eb-810b-a87eeabdefba' -> 'en' ->> 'value'",
            'nodegroupid': '325a2f2f-efe4-11eb-9b0c-a87eeabdefba'
        },
        'MonumentRevision': {
            'sql': "'52403903-9f4c-400f-81ce-09a5e8b9d925' -> 'en' ->> 'value'",
            'nodegroupid': 'cbf55769-eaf1-4074-84d9-8a47310dfbc2'
        },
        'Consultation': {
            'sql': "'b37552be-9527-11ea-9213-f875a44e0e11' -> 'en' ->> 'value'",
            'nodegroupid': 'b37552ba-9527-11ea-96b5-f875a44e0e11'
        }
    }

    sort_options = {
        'resourceid': {
            'Monument': {
                'sql': "'325a430a-efe4-11eb-810b-a87eeabdefba' -> 'en' ->> 'value'",
                'nodegroupid': '325a2f2f-efe4-11eb-9b0c-a87eeabdefba'
            },
            'MonumentRevision': {
                'sql': "'52403903-9f4c-400f-81ce-09a5e8b9d925' -> 'en' ->> 'value'",
                'nodegroupid': 'cbf55769-eaf1-4074-84d9-8a47310dfbc2'
            },
            'Consultation': {
                'sql': "'b37552be-9527-11ea-9213-f875a44e0e11' -> 'en' ->> 'value'",
                'nodegroupid': 'b37552ba-9527-11ea-96b5-f875a44e0e11'
            }
        },
        'hb_number': {
            'Monument': {
                'sql': "'250002fe-3aae-11ef-91fd-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
            },
            'MonumentRevision': {
                'sql': "'b6ec253e-3aaf-11ef-a2d0-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': '2948f54a-3aaf-11ef-91fd-0242ac120003'
            },
            'Consultation': {
                'sql': "",
                'nodegroupid': ""
            }
        },
        'smr_number': {
            'Monument': {
                'sql': "'158e1ed2-3aae-11ef-a2d0-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
            },
            'MonumentRevision': {
                'sql': "'59a7f542-3aaf-11ef-a2d0-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': '2948f54a-3aaf-11ef-91fd-0242ac120003'
            },
            'Consultation': {
                'sql': "",
                'nodegroupid': ""
            }
        },
        'ihr_number': {
            'Monument': {
                'sql': "'1de9abf0-3aae-11ef-91fd-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
            },
            'MonumentRevision': {
                'sql': "'7968e094-3aaf-11ef-91fd-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': '2948f54a-3aaf-11ef-91fd-0242ac120003'
            },
            'Consultation': {
                'sql': "",
                'nodegroupid': ""
            }
        },
        'historic_parks_and_gardens': {
            'Monument': {
                'sql': "'2c2d02fc-3aae-11ef-91fd-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
            },
            'MonumentRevision': {
                'sql': "'e7ee4eaa-3aaf-11ef-a2d0-0242ac120003' -> 'en' ->> 'value'",
                'nodegroupid': '2948f54a-3aaf-11ef-91fd-0242ac120003'
            },
            'Consultation': {
                'sql': "",
                'nodegroupid': ""
            }
        },
    }

    base_filters = {
        'Monument': """
            EXISTS (
                SELECT 1 FROM tiles t2
                WHERE t2.resourceinstanceid = t_fixed.resourceinstanceid
                AND t2.nodegroupid = '3897b87a-1902-11ef-aa9f-0242ac150006'
                AND t2.tiledata ->> '3a0ab672-190b-11ef-aa9c-0242ac150006' = '7f81d135-45ac-483f-96f4-2fa8ca882d79'
            )
        """,
        'MonumentRevision': """
            EXISTS (
                SELECT 1 FROM tiles t2
                WHERE t2.resourceinstanceid = t_fixed.resourceinstanceid
                AND t2.nodegroupid = '3c51740c-dbd0-11ee-8835-0242ac120006'
                AND t2.tiledata ->> 'ad22dad6-dbd0-11ee-b0db-0242ac120006' IS NULL
            )
        """,
        'Consultation': """
            t_fixed.tiledata -> 'b37552be-9527-11ea-9213-f875a44e0e11' -> 'en' ->> 'value' LIKE 'EVM%'
            AND EXISTS (
                SELECT 1 FROM tiles t2
                WHERE t2.resourceinstanceid = t_fixed.resourceinstanceid
                AND t2.tiledata ->> '5ffdc00e-03ad-11ef-948f-0242ac150003' IS NULL
            )
        """
    }

    extra_filters = {}

    if sort_by not in sort_options:
        raise ValueError(f"Invalid sort option: {sort_by}")

    ref_paths = sort_options[sort_by]
    order_direction = "DESC" if reverse else "ASC"

    def build_subquery(model_type):
        nodegroupid = ref_paths[model_type]['nodegroupid']
        sql_path = ref_paths[model_type]['sql']
        base_filter = base_filters[model_type]
        extra = extra_filters.get(model_type)

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

    subqueries = [
        build_subquery('Monument'),
        build_subquery('MonumentRevision'),
        build_subquery('Consultation'),
    ]

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