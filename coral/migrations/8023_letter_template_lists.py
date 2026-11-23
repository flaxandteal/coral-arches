from django.db import migrations

SMC_LETTERS_LIST = "8b2abcec-98fc-53b5-9108-4cdfd17d1b6c"
AGRI_LETTERS_LIST = "1efee688-c3cd-5ede-878f-e43ea22348e9"
# (item id, prefLabel value id, label): the ids coral-graphs ships in coral_extra_rdm.
SMC_ITEMS = (
    ("2c61956c-a885-56a6-8bb4-60de847aeb4b", "29ef3f72-4e76-5c24-9b58-4347dc252934", "SMC Addendum Letter"),
    ("5084c959-7150-523e-8014-922f17b0aca7", "f79c46a1-9bfc-5fdb-960e-bb12930fef5c", "SMC Provisional Letter"),
    ("4ea04e4f-060f-5d0a-9284-80ed920cd38f", "33c7e8dc-0c7d-5efb-a8df-399a9fd7bf2e", "SMC Refusal Letter"),
    ("ae2861c8-f456-56ea-91bf-e3b20a5d7776", "102a0997-0f17-5276-9409-1976deb90594", "SMC Final Letter"),
    ("8e412bbc-9551-5d96-8c8a-8d9123b99798", "b9aed897-1a0f-56ae-ace4-78efb5d6b7a8", "SMC Final No Conditions Letter"),
    ("fee98aba-72c5-50a0-8ca7-649f48af9832", "ea0ad99d-a2a9-592e-b685-60f74f39fb4d", "SMC Provisional No Conditions Letter"),
    ("b22a920d-b222-519f-abbf-2464fc105e8c", "3c50b48e-b6ad-5718-bb4a-2cd6933aea8a", "SMC-CL Provisional Letter"),
    ("2b25b081-7d22-505a-904b-f20ae699313d", "b71d34e4-8e54-57f3-be28-dc83b6e44547", "SMC-CL Final Letter"),
)
DAERA_AIL_ITEM = ("55d79e17-cf59-5fb2-9a55-86012d5ef954", "1a95c0ed-2a35-581e-9580-b7e1e20fd541", "DAERA AIL Consultation")


def insert_item(list_id, order, item, value, label):
    return f"""
        INSERT INTO arches_controlled_lists_listitem (id, uri, sortorder, guide, list_id)
        VALUES ('{item}', 'https://coral-her.flaxandteal.co.uk/{item}', {order}, false, '{list_id}')
        ON CONFLICT (id) DO NOTHING;
        INSERT INTO arches_controlled_lists_listitemvalue (id, value, languageid, list_item_id, valuetype_id)
        VALUES ('{value}', '{label}', 'en', '{item}', 'prefLabel')
        ON CONFLICT (id) DO NOTHING;"""


def delete_items(items):
    ids = ", ".join(f"'{item}'" for item, _, _ in items)
    return f"""
        DELETE FROM arches_controlled_lists_listitemvalue WHERE list_item_id IN ({ids});
        DELETE FROM arches_controlled_lists_listitem WHERE id IN ({ids});"""


smc_items = "\n".join(insert_item(SMC_LETTERS_LIST, order, *row) for order, row in enumerate(SMC_ITEMS))

# A fresh build runs migrations before load_package, so the tables or the agriculture list may not exist yet.
forward = f"""
DO $$
BEGIN
    IF to_regclass('arches_controlled_lists_list') IS NULL THEN
        RETURN;
    END IF;
    INSERT INTO arches_controlled_lists_list (id, name, dynamic, searchable)
    VALUES ('{SMC_LETTERS_LIST}', 'Letters SMC', false, false)
    ON CONFLICT (id) DO NOTHING;
    {smc_items}
    IF EXISTS (SELECT 1 FROM arches_controlled_lists_list WHERE id = '{AGRI_LETTERS_LIST}') THEN
        {insert_item(AGRI_LETTERS_LIST, 2, *DAERA_AIL_ITEM)}
    END IF;
END $$;
"""

reverse = f"""
DO $$
BEGIN
    IF to_regclass('arches_controlled_lists_list') IS NULL THEN
        RETURN;
    END IF;
    {delete_items(SMC_ITEMS + (DAERA_AIL_ITEM,))}
    DELETE FROM arches_controlled_lists_list WHERE id = '{SMC_LETTERS_LIST}';
END $$;
"""


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8022_consultation_type_list_and_signoff_widgets"),
    ]

    operations = [
        migrations.RunSQL(forward, reverse),
    ]
