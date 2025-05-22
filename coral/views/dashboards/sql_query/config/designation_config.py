DESIGNATION_SQL_QUERY_CONFIG = {
    "base_sort": {
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
    "sort_options": {
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
    },
    "base_filters": {
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
    },
    "extra_filters": {
        'council': {
            'Monument': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = '447973ce-d7e2-11ee-a4a1-0242ac120006'
                    AND t_filter.tiledata ->> '447973ce-d7e2-11ee-a4a1-0242ac120006' = '{filter_value}'
                )
                """,
            'MonumentRevision': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = '02003ed4-b2b5-4fcc-847b-bc34e7c72ee3'
                    AND t_filter.tiledata ->> '02003ed4-b2b5-4fcc-847b-bc34e7c72ee3' = '{filter_value}'
                )
                """,
            'Consultation': """
                EXISTS (
                SELECT 1
                FROM tiles t_rel
                WHERE
                    t_rel.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_rel.nodegroupid = '58a2b98f-a255-11e9-9a30-00224800b26d'
                    AND EXISTS (
                        SELECT 1
                        FROM tiles t_council
                        WHERE
                            t_council.resourceinstanceid IN (
                                SELECT (value::jsonb->>'resourceId')::uuid
                                FROM jsonb_array_elements(
                                    t_rel.tiledata -> '58a2b98f-a255-11e9-9a30-00224800b26d'
                                ) as value
                            )
                            AND t_council.nodegroupid = '447973ce-d7e2-11ee-a4a1-0242ac120006'
                            AND t_council.tiledata ->> '447973ce-d7e2-11ee-a4a1-0242ac120006' = '{filter_value}'
                    )
            )
                """,
        },
        'date': {
            'Monument': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = '7e0533aa-37b7-11ef-9263-0242ac150006'
                    AND t_filter.tiledata ->> '85396d94-37bc-11ef-9263-0242ac150006' IS NOT NULL
                )
                """,
            'MonumentRevision': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = '3c51740c-dbd0-11ee-8835-0242ac120006'
                    AND t_filter.tiledata ->> 'd70da550-3798-11ef-a167-0242ac150006' IS NOT NULL
                )
                """,
            'Consultation': ""
        },
        'heritage_asset': {},
        'meetings': {},
        'revision': {}
    }
}
