"""Guards the Digital Object name tile the response-file upload writes.

related-document-upload / file-template / pdf-merger all POST the same template. It used
to carry four pre-v8 concept ids on `reference` nodes, which failed the whole tile - so no
name was written, no relationship followed, and the upload vanished from the Responses step.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_digital_object_name_tile.py').read(), {'__name__': '__main__'})"`
"""

from arches.app.datatypes.datatypes import DataTypeFactory
from arches.app.models.models import Node

NAME_NODEGROUP = 'c61ab163-9513-11ea-9bb6-f875a44e0e11'
NAME_NODE = 'c61ab16c-9513-11ea-89a4-f875a44e0e11'
# The four the templates used to set, with the values they used to set them to.
DEAD_DEFAULTS = {
    'c61ab168-9513-11ea-9980-f875a44e0e11': '04a4c4d5-5a5e-4018-93aa-65abaa53fb53',
    'c61ab169-9513-11ea-b7c1-f875a44e0e11': '8a96a261-cd79-48e2-9f12-74924c152b00',
    'c61ab16a-9513-11ea-9afb-f875a44e0e11': 'a0e096e2-f5ae-4579-950d-3040714713b4',
    'c61ab16b-9513-11ea-ab9d-f875a44e0e11': '5a88136a-bf3a-4b48-a830-a7f42000dd24',
}

TEMPLATE = {
    'c61ab166-9513-11ea-a44c-f875a44e0e11': None,
    'c61ab167-9513-11ea-9d50-f875a44e0e11': None,
    NAME_NODE: {'en': {'direction': 'ltr', 'value': 'HB Response files for CON/2026/1'}},
}


def errors_for(node_id, value):
    node = Node.objects.get(pk=node_id)
    datatype = DataTypeFactory().get_instance(node.datatype)
    return datatype.validate(value, node=node)


def test_the_old_defaults_were_the_failure():
    for node_id, dead in DEAD_DEFAULTS.items():
        assert errors_for(node_id, dead), f'{node_id} should reject {dead}'


def test_dropping_them_leaves_nothing_required():
    required = Node.objects.filter(nodegroup_id=NAME_NODEGROUP, isrequired=True)
    assert not required.exists(), [n.name for n in required]


def test_the_trimmed_template_validates():
    for node_id, value in TEMPLATE.items():
        assert errors_for(node_id, value) == [], (node_id, errors_for(node_id, value))


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
