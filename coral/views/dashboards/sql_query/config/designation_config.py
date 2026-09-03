# Heritage Asset and Consultation ids here follow the graphs as regenerated during
# the v8 upgrade: they match the live DB, output/output/graphs/resource_models, and
# the already-migrated add-building / add-monument workflows. coral/pkg/graphs still
# holds the pre-upgrade ids, so a fresh package load will not line up with this until
# those are regenerated too. Heritage Asset Revision was not regenerated, so its ids
# are unchanged.
#
# Council and Status Type are now `reference` (controlled list) nodes. A reference
# tile stores a list of {uri, list_id, labels: [{value, list_item_id, ...}]} rather
# than a bare option id, so those comparisons go through jsonb_array_elements rather
# than a `->>` equality.
#
# Heritage Asset and Heritage Asset Revision hold their councils in two separate
# controlled lists, which give the same eleven councils different list item ids. The
# filter value is therefore the LA code from the label ("LA01"), matched against the
# label text, so one value works for both models. See get_filter_options in
# coral/views/dashboards/designation_strategy.py, which produces those codes.

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
                'sql': "'4b9883ef-9aad-559a-bd84-e4bb7b94a358' -> 'en' ->> 'value'",
                'nodegroupid': 'ebd91984-e3fd-5dcd-b8e0-42d63cda77fc'
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
                'sql': "'d146451b-9140-5f81-b3de-9005acc01e28' -> 'en' ->> 'value'",
                'nodegroupid': 'ebd91984-e3fd-5dcd-b8e0-42d63cda77fc'
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
                'sql': "'0b14fb28-961e-5817-9cac-c61073b58981' -> 'en' ->> 'value'",
                'nodegroupid': 'ebd91984-e3fd-5dcd-b8e0-42d63cda77fc'
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
                'sql': "'1edc61a9-b64b-51ae-9077-536908761903' -> 'en' ->> 'value'",
                'nodegroupid': 'ebd91984-e3fd-5dcd-b8e0-42d63cda77fc'
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
        # Sign Off (a62658ef, formerly Garden Sign Off) with Status Type set to
        # 'Provisional' (2bd60958) in the sign off status list.
        'Monument': """
            EXISTS (
                SELECT 1 FROM tiles t2,
                    jsonb_array_elements(
                        CASE
                            WHEN jsonb_typeof(t2.tiledata -> 'e54c9269-5134-5eb2-a592-953c8799776e') = 'array'
                            THEN t2.tiledata -> 'e54c9269-5134-5eb2-a592-953c8799776e'
                            ELSE '[]'::jsonb
                        END
                    ) AS ref
                WHERE t2.resourceinstanceid = t_fixed.resourceinstanceid
                AND t2.nodegroupid = 'a62658ef-bb95-5dc5-a43f-77118dc1806c'
                AND ref -> 'labels' -> 0 ->> 'list_item_id' = '2bd60958-34f1-5728-ad88-86cbab10bcb8'
            )
        """,
        'MonumentRevision': """
            NOT EXISTS (
                SELECT 1 FROM tiles t2
                WHERE t2.resourceinstanceid = t_fixed.resourceinstanceid
                AND t2.nodegroupid = '3c51740c-dbd0-11ee-8835-0242ac120006'
                AND t2.tiledata ->> 'ad22dad6-dbd0-11ee-b0db-0242ac120006' IS NOT NULL
            )
        """,
        'Consultation': """
            t_fixed.tiledata -> 'b37552be-9527-11ea-9213-f875a44e0e11' -> 'en' ->> 'value' LIKE 'EVM%'
            AND NOT EXISTS (
                SELECT 1 FROM tiles t2
                WHERE t2.resourceinstanceid = t_fixed.resourceinstanceid
                AND t2.nodegroupid = '5064f4bf-ecc7-5b16-a998-765c88409fea'
                AND t2.tiledata ->> '61788794-a20a-5cc9-b30e-9ee0f26d49cd' IS NOT NULL
            )
        """
    },
    "extra_filters": {
        'council': {
            'Monument': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter,
                        jsonb_array_elements(
                            CASE
                                WHEN jsonb_typeof(t_filter.tiledata -> 'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c') = 'array'
                                THEN t_filter.tiledata -> 'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c'
                                ELSE '[]'::jsonb
                            END
                        ) AS ref,
                        jsonb_array_elements(ref -> 'labels') AS lbl
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = 'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c'
                    AND lbl ->> 'value' LIKE '{filter_value} - %'
                )
                """,
            'MonumentRevision': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter,
                        jsonb_array_elements(
                            CASE
                                WHEN jsonb_typeof(t_filter.tiledata -> '02003ed4-b2b5-4fcc-847b-bc34e7c72ee3') = 'array'
                                THEN t_filter.tiledata -> '02003ed4-b2b5-4fcc-847b-bc34e7c72ee3'
                                ELSE '[]'::jsonb
                            END
                        ) AS ref,
                        jsonb_array_elements(ref -> 'labels') AS lbl
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = '02003ed4-b2b5-4fcc-847b-bc34e7c72ee3'
                    AND lbl ->> 'value' LIKE '{filter_value} - %'
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
                        FROM tiles t_council,
                            jsonb_array_elements(
                                CASE
                                    WHEN jsonb_typeof(t_council.tiledata -> 'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c') = 'array'
                                    THEN t_council.tiledata -> 'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c'
                                    ELSE '[]'::jsonb
                                END
                            ) AS ref,
                            jsonb_array_elements(ref -> 'labels') AS lbl
                        WHERE
                            t_council.resourceinstanceid IN (
                                SELECT (value::jsonb->>'resourceId')::uuid
                                FROM jsonb_array_elements(
                                    CASE
                                        WHEN jsonb_typeof(t_rel.tiledata -> '58a2b98f-a255-11e9-9a30-00224800b26d') = 'array'
                                        THEN t_rel.tiledata -> '58a2b98f-a255-11e9-9a30-00224800b26d'
                                        ELSE '[]'::jsonb
                                    END
                                ) as value
                            )
                            AND t_council.nodegroupid = 'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c'
                            AND lbl ->> 'value' LIKE '{filter_value} - %'
                    )
            )
                """,
        },
        'date': {
            'Monument': """
                EXISTS (
                    SELECT 1 FROM tiles t_filter
                    WHERE t_filter.resourceinstanceid = t_fixed.resourceinstanceid
                    AND t_filter.nodegroupid = '5879972a-96d5-51d4-8fbc-f78be2484ce2'
                    AND t_filter.tiledata ->> '8836a65e-92cb-5330-b468-c6adbe6cc7a5' IS NOT NULL
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
