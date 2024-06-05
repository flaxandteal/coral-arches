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

import os
import logging
from pathlib import Path
from tests import test_settings
from tests.permissions.base_permissions_framework_test import ArchesPermissionFrameworkTestCase
from django.core import management
from django.urls import reverse
from django.test.client import RequestFactory, Client
from django.test.utils import captured_stdout
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from arches.app.models.models import GraphModel, ResourceInstance, Node
from arches.app.models.resource import Resource
from arches_orm.adapter import context_free
from arches.app.search.search_engine_factory import SearchEngineInstance as se

# these tests can be run from the command line via
# python manage.py test tests.permissions.permission_tests --settings="tests.test_settings"

Person = None
Set = None
LogicalSet = None
ArchesGroup = None
Activity = None

class CoralCasbinPermissionTests(ArchesPermissionFrameworkTestCase):
    @context_free
    def test_user_cannot_view_without_permission(self):
        """
        Tests if a user is _not_ allowed to view a resource with implicit permissions but is with explicit permissions, provided
        that 'view_resourceinstance' is assigned.
        """

        from coral.settings import GROUPINGS
        from coral.utils.casbin import SetApplicator

        person = Person()
        ash = person.name.append()
        ash.full_name = "Ash"
        person.user_account = self.user
        person.save()
        activity = Activity.create()
        activity.save()

        st = Set.find(GROUPINGS["permissions"]["root_group"])
        st.members.append(activity)
        st.save()

        SetApplicator(False, True).apply_sets(activity.id)

        gp = ArchesGroup.find(GROUPINGS["groups"]["root_group"])
        gp.members.append(person)
        gp.save()
        permission = gp.permissions.append()
        permission.object = st
        PermissionType = permission.action.__collection__
        permission.action.append(PermissionType.Reading)
        permission.action.append(PermissionType.Writing)
        gp.save()

        # THIS IS NOT GUARANTEED TO HAPPEN IN TIME OTHERWISE...
        se.es.indices.refresh(index="test_resources")

        framework = self.FRAMEWORK()
        framework.recalculate_table()
        enforcer = framework._enforcer
        enforcer.load_policy()
        logging.disable(logging.NOTSET)
        enforcer.model.logger.setLevel(logging.INFO)
        print(enforcer.model.print_policy())

        resource = activity._.resource
        self.resource_instance_id = activity._.resource.pk
        implicit_permission = self.framework.user_can_read_resource(self.user, str(activity.id))
        self.framework.assign_perm("view_resourceinstance", self.group, resource)
        framework.recalculate_table()
        can_access_with_view_permission = self.framework.user_can_read_resource(self.user, self.resource_instance_id)
        print(implicit_permission, can_access_with_view_permission)
        self.assertTrue(
            implicit_permission is False and can_access_with_view_permission is True
        )

    @classmethod
    def setUpClass(cls):
        global Person, Organization, Set, LogicalSet, ArchesGroup, Activity
        super().setUpClass()

        test_models_path = Path(__file__).parent.parent.parent / "models"
        for graph in ("Person", "Group", "Set", "Logical Set", "Activity"):
            print("loading", graph)
            management.call_command("packages", operation="import_graphs", source=str(test_models_path / f"{graph}.json"), yes=True, verbosity=0)
        management.call_command("packages", operation="import_reference_data", source=str(test_models_path.parent / "reference_data" / "Permission_Types_20231208.xml"), yes=True, verbosity=0)
        management.call_command("packages", operation="import_reference_data", source=str(test_models_path.parent / "reference_data" / "collections.xml"), yes=True, verbosity=0)
        management.call_command("packages", operation="import_business_data", source=str(test_models_path.parent / "business_data" / "Root Group.json"), yes=True, verbosity=0, overwrite="overwrite")
        management.call_command("packages", operation="import_business_data", source=str(test_models_path.parent / "business_data" / "Root Set.json"), yes=True, verbosity=0, overwrite="overwrite")

        import coral.permissions.casbin
        import coral.utils.casbin
        from arches_orm import wkrm
        wkrm.resource_models = {}
        models = wkrm.get_resource_models_for_adapter()["by-class"]
        cls.FRAMEWORK = coral.permissions.casbin.CasbinPermissionFramework
        coral.permissions.casbin.Person = models["Person"]
        coral.permissions.casbin.Organization = models["Organization"]
        coral.permissions.casbin.Set = models["Set"]
        coral.permissions.casbin.LogicalSet = models["LogicalSet"]
        coral.permissions.casbin.Group = models["Group"]
        coral.utils.casbin.Person = models["Person"]
        coral.utils.casbin.Organization = models["Organization"]
        coral.utils.casbin.Set = models["Set"]
        coral.utils.casbin.LogicalSet = models["LogicalSet"]
        coral.utils.casbin.Group = models["Group"]

        Activity = models["Activity"]
        Person = models["Person"]
        Organization = models["Organization"]
        Set = models["Set"]
        LogicalSet = models["LogicalSet"]
        ArchesGroup = models["Group"]

