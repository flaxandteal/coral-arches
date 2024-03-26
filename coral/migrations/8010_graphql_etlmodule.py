from django.db import migrations, models

add_csv_importer = """
    insert into etl_modules (
        etlmoduleid,
        name,
        description,
        etl_type,
        component,
        componentname,
        modulename,
        classname,
        config,
        icon,
        slug,
        reversible)
    values (
        'a6af3a25-50ac-47a1-a876-bcb13dab411b',
        'Bulk import via Well-Known Resource Model',
        'Import from WKRM',
        'import',
        'bulk-import-wkrm',
        'bulk-import-wkrm',
        '_bulk_import_wkrm.py',
        'BulkImportWKRM',
        '{"bgColor": "#0591ef", "circleColor": "#00adf3", "show": false}',
        'fa fa-upload',
        'bulk-import-wkrm',
        true);
    """
remove_csv_importer = """
    delete from etl_modules where etlmoduleid = 'a6af3a25-50ac-47a1-a876-bcb13dab411b';
    """

class Migration(migrations.Migration):

    dependencies = [
        ("models", "8009_etlmodule"),
        ("models", "10165_etlmodule_reversible"),
    ]

    operations = [
        migrations.RunSQL(
            add_csv_importer,
            remove_csv_importer,
        ),
    ]
