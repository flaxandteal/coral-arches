"""
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

import logging
from django.views.generic import View
from arches.app.views.concept import Concept
from arches.app.models import models
from arches.app.models.system_settings import settings
from arches.app.models.resource import Resource
from arches.app.utils.response import JSONResponse, JSONErrorResponse
from arches.app.utils.betterJSONSerializer import JSONSerializer


logger = logging.getLogger(__name__)


def get_resource_relationship_types():
    resource_relationship_types = Concept().get_child_collections("00000000-0000-0000-0000-000000000005")
    default_relationshiptype_valueid = None
    for relationship_type in resource_relationship_types:
        if relationship_type[0] == "00000000-0000-0000-0000-000000000007":
            default_relationshiptype_valueid = relationship_type[2]
    relationship_type_values = {
        "values": [{"id": str(c[2]), "text": str(c[1])} for c in resource_relationship_types],
        "default": str(default_relationshiptype_valueid),
    }
    return relationship_type_values


class GroupManagerView(View):
    graphs = (
        models.GraphModel.objects.all()
        .exclude(pk=settings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID)
        .exclude(isresource=False)
        .exclude(publication=None)
    )

    def __init__(self):
        pass

    def get(
        self,
        request,
        grouping="groups",
        graphid=None,
        resourceid=None,
        nav_menu=True,
    ):
        try:
            grouping_config = settings.GROUPINGS[grouping]
        except KeyError:
            ret  = {
                "error": "unknown-grouping",
                "message": "Unknown grouping",
            }
            return JSONErrorResponse(ret, status=400)
        lang = request.GET.get("lang", request.LANGUAGE_CODE)
        relationship_types= get_resource_relationship_types()

        rootresourceid = resourceid or grouping_config["root_group"]

        resource_instance = Resource.objects.get(pk=rootresourceid)
        graph = resource_instance.graph

        # TODO: people might be under groups, for instance
        # if str(graph.graphid) != grouping_config["graph_id"]:
        #     ret  = {
        #         "error": "wrong-grouping-graph",
        #         "message": "Requested resource does not match grouping graph type",
        #         "resourceGraphId": graph.graphid,
        #         "groupingGraphId": grouping_config["graph_id"],
        #         "grouping": grouping
        #     }
        #     return JSONErrorResponse(ret, status=400)

        all_resources = {
            "resource_relationships": [],
            "related_resources": {}
        }
        core_resources = {}
        new_resources = {rootresourceid}
        old_resources = set()
        level = 0

        allowed_relationships = grouping_config["allowed_relationships"]
        def _test_relationship(resourceid, rr):
            forward, back = allowed_relationships.get(rr["relationshiptype"], (False, False))
            return (
                back and str(resourceid) == str(rr["resourceinstanceidfrom"])
            ) or (
                forward and str(resourceid) == str(rr["resourceinstanceidto"])
            )

        while (level := level + 1) < 5:
            for resourceid in new_resources:
                resource_instance = Resource.objects.get(pk=resourceid)
                related_resources = resource_instance.get_related_resources(
                    lang=lang, user=request.user, graphs=self.graphs
                )
                if not core_resources:
                    core_resources.update(related_resources)
                if related_resources.get("resource_relationships"):
                    relationships = [
                        rr for rr in related_resources["resource_relationships"] if _test_relationship(resourceid, rr)
                    ]
                    all_resources["resource_relationships"] += relationships
                    relevant_resources = set(sum([
                        [str(rr["resourceinstanceidfrom"]), str(rr["resourceinstanceidto"])]
                        for rr in relationships
                    ], []))
                    all_resources["related_resources"].update({
                        r["resourceinstanceid"]: r for r in related_resources["related_resources"] if r["resourceinstanceid"] in relevant_resources
                    })
                old_resources.add(resourceid)
            new_resources = set(all_resources["related_resources"].keys()) - old_resources
        all_resources["related_resources"] = list(all_resources["related_resources"].values())
        core_resources.update(all_resources)

        return JSONResponse({
            "resourceid": rootresourceid,
            "graph": graph,
            "relatedResources": core_resources,
            "relationshipTypes": relationship_types
        })
