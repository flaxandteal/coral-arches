"""Guards the /orm/resources view the FMW monument panel loads its details from.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_orm_view.py').read(), {'__name__': '__main__'})"`
"""

from django.contrib.auth.models import User
from django.db import transaction
from django.test import Client
from querysets_shim.adapter import admin
from querysets_shim.models import Monument

DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba'
BFILE_NODEGROUP = '34e9c49c-5523-598a-98a2-32224336d197'
BFILE_NODE = '0d0b653a-03e2-5a35-9ed4-9219b0681dd0'
SHOW_NODES = ['designation_or_protection_type', 'townland', 'b_file_reference_number']


def client():
    c = Client()
    c.force_login(User.objects.filter(is_superuser=True).first())
    return c


def post(**params):
    body = '&'.join(f'{k}={v}' for k, vs in params.items() for v in (vs if isinstance(vs, list) else [vs]))
    return client().post('/orm/resources', body, content_type='application/x-www-form-urlencoded').json()


def monument_with_designation_and_townland():
    from querysets_shim.values import EMPTY, values_by_resource
    from arches.app.models.models import TileModel

    with admin():
        tiles = TileModel.objects.filter(nodegroup_id=DESIGNATIONS_NODEGROUP)
        ids = [str(i) for i in tiles.values_list('resourceinstance_id', flat=True).distinct()[:500]]
        found = values_by_resource(Monument, ids, SHOW_NODES[:2])
        for rid in ids:
            values = found.get(rid, EMPTY)
            if any(values.all('designation_or_protection_type')) and any(values.all('townland')):
                return rid
    raise AssertionError('no Heritage Asset with a designation and townland in this database')


def monument_with_designation_and_townland_other(exclude):
    from arches.app.models.models import TileModel

    tiles = TileModel.objects.filter(nodegroup_id=DESIGNATIONS_NODEGROUP).exclude(resourceinstance_id=exclude)
    return str(tiles.values_list('resourceinstance_id', flat=True).first())


def test_many_ids_come_back_keyed_by_id_as_label_text():
    rid = monument_with_designation_and_townland()
    result = post(**{'resourceids[]': [rid], 'show_nodes[]': SHOW_NODES})
    for alias in ('designation_or_protection_type', 'townland'):
        texts = result[rid][alias]
        assert texts and all(isinstance(t, str) and t for t in texts), (alias, texts)
        assert not any(len(t) == 36 and t.count('-') == 4 for t in texts), (alias, texts)


def test_single_resourceid_shape_is_unchanged():
    rid = monument_with_designation_and_townland()
    single = post(resourceid=rid, **{'show_nodes[]': SHOW_NODES})
    keyed = post(**{'resourceids[]': [rid], 'show_nodes[]': SHOW_NODES})
    assert set(single) == set(SHOW_NODES), single
    assert single == keyed[rid]


def test_resource_instance_alias_comes_back_as_the_target_name_for_every_id():
    from arches.app.models.models import ResourceInstance, TileModel
    from querysets_shim.values import descriptor_names

    rid = monument_with_designation_and_townland()
    other = monument_with_designation_and_townland_other(rid)
    expected = descriptor_names([other])[other]
    assert expected, 'target has no descriptor name'
    b_file = {'resourceId': other, 'ontologyProperty': '', 'inverseOntologyProperty': ''}
    try:
        with transaction.atomic():
            TileModel.objects.create(
                resourceinstance_id=rid, nodegroup_id=BFILE_NODEGROUP, data={BFILE_NODE: [b_file]})
            result = post(**{'resourceids[]': [rid, other], 'show_nodes[]': SHOW_NODES})
            raise Rollback
    except Rollback:
        pass
    assert result[rid]['b_file_reference_number'] == [expected], result[rid]
    assert result[other]['b_file_reference_number'] == [], result[other]


class Rollback(Exception):
    pass


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
