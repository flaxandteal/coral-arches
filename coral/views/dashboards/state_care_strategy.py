from dateutil import parser
from django.db.models import CharField, Exists, OuterRef, Subquery, TextField, UUIDField, Value
from django.db.models.fields.json import KeyTextTransform, KeyTransform
from django.db.models.functions import Cast, Coalesce
from arches.app.models.models import ResourceInstance, TileModel
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.utils.reference_values import reference_label
from querysets_shim.adapter import admin
from querysets_shim.values import EMPTY, active_language, descriptor_names, values_by_resource, related_resource_ids

HA_REF_ALIASES = ['ihr_number', 'hb_number', 'smr_number', 'historic_parks_and_gardens']
HA_ALIASES = [*HA_REF_ALIASES, 'townland', 'council']

# One row per model. An item is open while `signed_off` holds no value; the
# sorts read `sort_date` and `sort_by`, the card reads `inputby` and `related`.
SOURCES = [
    {
        'filter': 'state_care', 'counter': 'State Care Condition Surveys', 'model_class': 'StateCareCondition',
        'signed_off': 'signed_off_by', 'sort_date': 'completed_on', 'sort_by': 'completed_by',
        'date': 'completed_on', 'inputby': 'completed_by', 'related': 'heritage_asset',
        'userheading': 'Completed by', 'dateheading': 'Completed on date',
        'slug': 'state-care-condition-survey-workflow', 'model': 'State Care Condition',
    },
    {
        'filter': 'risk_assessment', 'counter': 'Risk Assessments', 'model_class': 'RiskAssessment',
        'signed_off': 'sign_off_by', 'sort_date': 'assessment_date', 'sort_by': 'assessment_done_by',
        'date': 'assessment_date', 'inputby': 'assessment_done_by', 'related': 'associated_heritage_assets',
        'userheading': 'Assessment done by', 'dateheading': 'Assessment date',
        'slug': 'risk-assessment-workflow', 'model': 'Risk Assessment',
    },
    {
        'filter': 'ranger_inspection', 'counter': 'Ranger Inspections', 'model_class': 'RangerInspection',
        'signed_off': 'reviewed_by', 'sort_date': 'report_submission_date', 'sort_by': 'submitted_by',
        'date': 'report_submission_date', 'inputby': 'submitted_by', 'related': 'related_heritage_assets',
        'userheading': 'Submitted by', 'dateheading': 'Report Submission Date',
        'slug': 'ranger-inspection-workflow', 'model': 'Ranger Inspection',
    },
    {
        'filter': 'curatorial_inspection', 'counter': 'Curatorial Inspections', 'model_class': 'Consultation',
        'signed_off': 'report_submitted_by_value', 'sort_date': 'sign_off_date_value', 'sort_by': 'report_submitted_by_value',
        'date': 'sign_off_date_value', 'inputby': 'reviewed_by_value', 'related': 'related_monuments_and_areas',
        'userheading': 'Assessment done by', 'dateheading': 'Assessment Date',
        'slug': 'curatorial-workflow', 'model': 'Curatorial Inspection',
    },
]

BLANK = Value('', output_field=TextField())
SORT_COLUMNS = {'displayname': 'sort_name', 'completed_on_date': 'sort_date', 'completed_by': 'sort_by'}


def format_date(value):
    if not value:
        return None
    try:
        return parser.parse(str(value)).strftime("%d-%m-%Y")
    except (ValueError, OverflowError):
        return None


def first_resource_id(node_id):
    """SQL expression for the first related resource id held in a resource-instance node."""
    return KeyTextTransform('resourceId', KeyTransform('0', KeyTransform(str(node_id), 'data')))


class StateCareTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='displayname', sort_order='desc', filter='all'):
        from querysets_shim import models as shim_models
        from querysets_shim.models import Monument, Person
        with admin():
            language = active_language()

            def open_items(source):
                """This model's resources with no sign-off value, sign-off tile or not, plus the columns to sort on."""
                cls = getattr(shim_models, source['model_class'])
                nodes = cls._._node_objects_by_alias()

                def tiles_of(alias):
                    return TileModel.objects.filter(
                        resourceinstance_id=OuterRef('pk'), nodegroup_id=nodes[alias].nodegroup_id)

                signed_off = tiles_of(source['signed_off']).filter(
                    **{f'data__{nodes[source["signed_off"]].nodeid}__0__resourceId__isnull': False})
                date_tiles = tiles_of(source['sort_date']).annotate(
                    v=KeyTextTransform(str(nodes[source['sort_date']].nodeid), 'data'))
                by_tiles = tiles_of(source['sort_by']).annotate(v=first_resource_id(nodes[source['sort_by']].nodeid))
                by_names = ResourceInstance.objects.filter(pk=Cast(OuterRef('by_id'), UUIDField())).annotate(
                    v=KeyTextTransform('name', KeyTransform(language, 'descriptors')))

                items = ResourceInstance.objects.filter(graph_id=cls._graphid).exclude(Exists(signed_off))
                if source['model_class'] == 'Consultation':
                    id_node = nodes['resourceid']
                    cin = TileModel.objects.filter(
                        nodegroup_id=id_node.nodegroup_id,
                        **{f'data__{id_node.nodeid}__{language}__value__startswith': 'CIN/'})
                    items = items.filter(pk__in=Subquery(cin.values('resourceinstance_id')))

                return items.annotate(
                    kind=Value(source['filter'], output_field=CharField()),
                    by_id=Subquery(by_tiles.values('v')[:1]),
                ).annotate(
                    sort_name=Coalesce(KeyTextTransform('name', KeyTransform(language, 'descriptors')), BLANK),
                    sort_date=Coalesce(Subquery(date_tiles.values('v')[:1]), BLANK),
                    sort_by=Coalesce(Subquery(by_names.values('v')[:1]), BLANK),
                ).values('resourceinstanceid', 'kind', 'sort_name', 'sort_date', 'sort_by')

            wanted = [s for s in SOURCES if s['filter'] == filter] or SOURCES
            querysets = [open_items(s) for s in wanted]
            counts = {s['filter']: qs.count() for s, qs in zip(wanted, querysets)}
            total_resources = sum(counts.values())

            column = SORT_COLUMNS.get(sort_by, 'sort_name')
            order = [f'-{column}' if sort_order == 'desc' else column, 'resourceinstanceid']
            combined = querysets[0].union(*querysets[1:]) if len(querysets) > 1 else querysets[0]
            start_index = (page - 1) * page_size
            rows = list(combined.order_by(*order)[start_index:start_index + page_size])
            kinds = {str(row['resourceinstanceid']): row['kind'] for row in rows}

            fields = {}
            for source in SOURCES:
                ids = [id for id, kind in kinds.items() if kind == source['filter']]
                cls = getattr(shim_models, source['model_class'])
                aliases = [source['date'], source['inputby'], source['related']]
                fields.update(values_by_resource(cls, ids, aliases))

            ha_ids, person_ids, reviewer_ids = [], [], []
            for id, values in fields.items():
                source = self.source_for(kinds[id])
                ha_ids += related_resource_ids(values.get(source['related']))[:1]
                if source['filter'] == 'curatorial_inspection':
                    reviewer_ids += related_resource_ids(values.get(source['inputby']))
                else:
                    person_ids += related_resource_ids(values.get(source['inputby']))

            prefetched = {
                'fields': fields,
                'kinds': kinds,
                'names': descriptor_names([*kinds, *reviewer_ids]),
                'heritage_assets': values_by_resource(Monument, ha_ids, HA_ALIASES),
                'people': values_by_resource(Person, person_ids, ['full_name']),
            }

            tasks = [self.build_data(str(row['resourceinstanceid']), groupId, prefetched) for row in rows]

            return tasks, total_resources, self.get_counters(counts)

    def source_for(self, kind):
        return next(s for s in SOURCES if s['filter'] == kind)

    def get_filter_options(self, groupId=None):
        """Return the available filter options for the state care tasks."""
        return [
            {'id': 'all', 'name': 'All', 'type': 'default'},
            {'id': 'state_care', 'name': 'State Care Condition Survey', 'type': 'state_care'},
            {'id': 'risk_assessment', 'name': 'Risk Assessment', 'type': 'risk_assessment'},
            {'id': 'ranger_inspection', 'name': 'Ranger Inspection', 'type': 'ranger_inspection'},
            {'id': 'curatorial_inspection', 'name': 'Curatorial Inspection', 'type': 'curatorial_inspection'},
        ]

    def get_counters(self, counts):
        return {'Resource Types': {s['counter']: counts.get(s['filter'], 0) for s in SOURCES}}

    def build_data(self, resource_id, groupId, prefetched):
        source = self.source_for(prefetched['kinds'][resource_id])
        values = prefetched['fields'].get(resource_id, EMPTY)

        inputby_ids = related_resource_ids(values.get(source['inputby']))
        if source['filter'] == 'curatorial_inspection':
            inputby = prefetched['names'].get(inputby_ids[0]) if inputby_ids else None
        else:
            inputby = self.person_names(inputby_ids, prefetched['people'])

        data = {
            'id': resource_id,
            'state': 'State',
            'displayname': prefetched['names'].get(resource_id),
            'userheading': source['userheading'],
            'dateheading': source['dateheading'],
            'inputby': inputby,
            'date': format_date(values.get(source['date'])),
            'slug': source['slug'],
            'model': source['model'],
        }

        related_ha = related_resource_ids(values.get(source['related']))
        if related_ha:
            data.update(self.heritage_asset_data(prefetched['heritage_assets'].get(related_ha[0], EMPTY)))
        return data

    def person_names(self, person_ids, people):
        """None when nobody is recorded; a person without a name tile is skipped."""
        if not person_ids:
            return None
        names = [people.get(id, EMPTY).get('full_name') for id in person_ids]
        return [name for name in names if name]

    def heritage_asset_data(self, values):
        refs = [values.get(alias) for alias in HA_REF_ALIASES]
        townlands = [reference_label([entry]) for entry in values.get('townland') or []]
        return {
            'haref': [ref for ref in refs if ref and ref != 'None'],
            'townland': [label for label in townlands if label],
            'council': reference_label(values.get('council')),
        }

    def get_sort_options(self):
        """Return the available sort options for state care tasks."""
        return [
            {'id': 'displayname', 'name': 'Name'},
            {'id': 'completed_on_date', 'name': 'Date Completed/Assessed'},
            {'id': 'completed_by', 'name': 'Completed/Assessed by'}
        ]
