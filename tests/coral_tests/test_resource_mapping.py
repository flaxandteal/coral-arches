"""Guards the mapping the letter/PDF generator builds from a resource.

file_template.py's GenericTemplateProvider walks the resource like a mapping. The shim's
ResourceModel resolves any unknown attribute to None, so a missing `items()` surfaced as
`TypeError: 'NoneType' object is not callable` rather than naming itself.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_resource_mapping.py').read(), {'__name__': '__main__'})"`
"""

from django.contrib.auth.models import User

from arches.app.models.resource import Resource
from coral.views.file_template import GenericTemplateProvider
from querysets_shim.wkrm import get_well_known_resource_model_by_graph_id

CONSULTATION_GRAPH = '8d41e49e-a250-11e9-9eab-00224800b26d'


def a_consultation():
    resource = Resource.objects.filter(graph_id=CONSULTATION_GRAPH).first()
    assert resource, 'no consultation in this database'
    resource.load_tiles()
    return resource


def a_wkri():
    resource = a_consultation()
    wkrm = get_well_known_resource_model_by_graph_id(resource.graph_id)
    return wkrm.find(resource.resourceinstanceid)


def test_a_resource_walks_like_a_mapping():
    wkri = a_wkri()
    aliases = wkri.keys()
    assert aliases, 'no top-level aliases'
    assert 'action' in aliases, aliases
    pairs = wkri.items()
    assert [alias for alias, _ in pairs] == aliases
    assert len(pairs) == len(aliases)


def test_an_unknown_attribute_is_still_none():
    # The shim's forgiving __getattr__ stays as it is; keys()/items() are real methods
    # sitting in front of it, not a change of that behaviour.
    assert a_wkri().no_such_node_alias_here is None


def test_nested_groups_are_flattened():
    # The letter's placeholders are leaf aliases inside semantic groups (address parts and
    # the like), so a mapping of top-level aliases alone leaves them as literal text.
    config = {
        'user': User.objects.filter(is_superuser=True).first(),
        'special': {'today': 'today'},
    }
    mapping = GenericTemplateProvider(a_consultation()).get_mapping(config)
    for leaf in ('street_value', 'town_or_city_value', 'postcode_value', 'planning_reference'):
        assert leaf in mapping, leaf


def test_the_generator_builds_a_mapping():
    config = {
        'user': User.objects.filter(is_superuser=True).first(),
        'special': {'today': 'today', 'user': 'user'},
    }
    mapping = GenericTemplateProvider(a_consultation()).get_mapping(config)
    assert len(mapping) > 20, len(mapping)
    assert 'today' in mapping


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
