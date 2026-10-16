"""Guards the Heritage Asset modular report config against the HA graph.

Runs without Django or a database. `python3 tests/coral_tests/test_ha_report_config.py`
"""

import json
import os
import sys
import types

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, ROOT)

# report_config.py only needs django.conf at import time; stub it so the pruning can be tested.
django = types.ModuleType('django')
django_conf = types.ModuleType('django.conf')
django_conf.settings = types.SimpleNamespace()
django.conf = django_conf
sys.modules.setdefault('django', django)
sys.modules.setdefault('django.conf', django_conf)

from coral.perf import report_config

COMPONENTS = 'arches_modular_reports/ModularReport/components/'
KNOWN_COMPONENTS = {
    COMPONENTS + name
    for name in (
        'ReportHeader', 'ReportToolbar', 'ReportTabs',
        'LinkedSections', 'DataSection', 'RelatedResourcesSection',
    )
} | {'coral_reports/LocationMap'}
EXCLUDED_DATATYPES = {'semantic', 'annotation', 'geojson-feature-collection'}

with open(os.path.join(ROOT, 'coral', 'report_configs', 'heritage_asset.json')) as f:
    CONFIG = json.load(f)['configs']['default']
with open(os.path.join(ROOT, 'coral', 'pkg', 'graphs', 'resource_models', 'Heritage Asset.json')) as f:
    GRAPH = json.load(f)['graph'][0]

NODES = {node['alias']: node for node in GRAPH['nodes'] if node['alias']}
NODEGROUP_BY_ALIAS = {
    node['alias']: node['nodegroup_id'] for node in GRAPH['nodes'] if node['alias']
}
TOP_LEVEL_NODEGROUPS = {
    nodegroup['nodegroupid']
    for nodegroup in GRAPH['nodegroups']
    if not nodegroup.get('parentnodegroup_id')
}


def walk(components):
    """Every component in the tree, tabs and sections included."""
    for component in components:
        yield component
        config = component.get('config') or {}
        for group in config.get('tabs', []) + config.get('sections', []):
            yield from walk(group['components'])


def data_sections(config):
    return [
        c['config'] for c in walk(config['components']) if c['component'] == COMPONENTS + 'DataSection'
    ]


def test_aliases_exist_in_graph():
    sections = data_sections(CONFIG)
    assert sections, 'no DataSections in the config'
    for section in sections:
        assert section['nodegroup_alias'] in NODES, section['nodegroup_alias']
        for alias in section['node_aliases']:
            assert alias in NODES, alias


def test_every_top_level_card_appears_once():
    seen = [NODEGROUP_BY_ALIAS[s['nodegroup_alias']] for s in data_sections(CONFIG)]
    card_nodegroups = {card['nodegroup_id'] for card in GRAPH['cards']} & TOP_LEVEL_NODEGROUPS
    assert card_nodegroups, 'no top-level cards found'
    missing = card_nodegroups - set(seen)
    assert not missing, f'cards missing from the report: {sorted(missing)}'
    assert len(seen) == len(set(seen)), 'a card appears in more than one section'


def test_no_geometry_aliases():
    for section in data_sections(CONFIG):
        for alias in section['node_aliases']:
            assert NODES[alias]['datatype'] not in EXCLUDED_DATATYPES, alias


def test_components_are_known():
    used = {c['component'] for c in walk(CONFIG['components'])}
    assert COMPONENTS + 'DataSection' in used and 'coral_reports/LocationMap' in used
    assert used <= KNOWN_COMPONENTS, used - KNOWN_COMPONENTS


def test_pruning_recurses_through_tabs_and_sections():
    data = lambda alias: {
        'component': COMPONENTS + 'DataSection',
        'config': {'nodegroup_alias': alias, 'node_aliases': [alias, 'blank'], 'has_write_permission': True},
    }
    related = {'component': COMPONENTS + 'RelatedResourcesSection', 'config': {'graph_slug': 'enforcement'}}
    unrelated = {'component': COMPONENTS + 'RelatedResourcesSection', 'config': {'graph_slug': 'person'}}
    config = {'components': [{
        'component': COMPONENTS + 'ReportTabs',
        'config': {'tabs': [
            {'name': 'Full', 'components': [{
                'component': COMPONENTS + 'LinkedSections',
                'config': {'sections': [
                    {'name': 'Has', 'components': [data('has')]},
                    {'name': 'Empty', 'components': [data('empty')]},
                ]},
            }]},
            {'name': 'Hollow', 'components': [{
                'component': COMPONENTS + 'LinkedSections',
                'config': {'sections': [{'name': 'Empty', 'components': [data('empty')]}]},
            }]},
            {'name': 'Related', 'components': [{
                'component': COMPONENTS + 'LinkedSections',
                'config': {'sections': [{'name': 'R', 'components': [related, unrelated]}]},
            }]},
        ]},
    }]}
    report_config._populated_node_aliases = lambda resourceid: {'has'}
    report_config._related_graph_slugs = lambda resourceid: {'enforcement'}
    pruned = report_config.prune_empty_sections(config, 'rid')
    tabs = pruned['components'][0]['config']['tabs']
    assert [tab['name'] for tab in tabs] == ['Full', 'Related']
    sections = tabs[0]['components'][0]['config']['sections']
    assert [section['name'] for section in sections] == ['Has']
    has = sections[0]['components'][0]['config']
    assert has['node_aliases'] == ['has'] and has['has_write_permission'] is False
    assert tabs[1]['components'][0]['config']['sections'][0]['components'] == [related]


if __name__ == '__main__':
    for name, test in list(globals().items()):
        if name.startswith('test_'):
            test()
    print('ok')
