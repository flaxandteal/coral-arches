"""Guards the /reference-value resolver the workflow prefills depend on.

Workflow `prefilledNodes` are written as bare list-item ids, which a reference node
rejects with a bare "Unknown error"; the frontend resolves them through this view.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_reference_value_view.py').read(), {'__name__': '__main__'})"`
"""

from arches_controlled_lists.datatypes.datatypes import ReferenceDataType
from django.contrib.auth.models import User
from django.test import Client

ASSIGNMENT_TEAM_NODE = '9f71504d-6c1e-53b7-8d33-f03f8e6ccdca'
ASSIGNMENT_TEAM_HB = '9ef9f72d-0d61-5376-934b-844698c3316e'


def client():
    c = Client()
    c.force_login(User.objects.filter(is_superuser=True).first())
    return c


def test_a_bare_id_is_still_rejected_by_the_node():
    # The shape the prefills used to write, and the reason this view exists.
    errors = ReferenceDataType().validate(ASSIGNMENT_TEAM_HB, nodeid=ASSIGNMENT_TEAM_NODE)
    assert errors and errors[0]['message'] == 'Unknown error', errors


def test_the_resolved_value_saves():
    response = client().get('/reference-value/' + ASSIGNMENT_TEAM_HB)
    assert response.status_code == 200, response.status_code
    value = response.json()
    assert ReferenceDataType().validate(value, nodeid=ASSIGNMENT_TEAM_NODE) == []
    assert value[0]['labels'][0]['list_item_id'] == ASSIGNMENT_TEAM_HB


def test_an_unknown_id_is_a_404():
    # resolvePrefilledNodes falls back to the raw value on anything but a 200, so a
    # prefill for a non-reference node has to come back unresolved rather than empty.
    response = client().get('/reference-value/00000000-0000-0000-0000-000000000000')
    assert response.status_code == 404, response.status_code


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
