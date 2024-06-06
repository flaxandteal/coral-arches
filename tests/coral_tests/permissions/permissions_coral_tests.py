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
import importlib
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

        # THIS IS NOT GUARANTEED TO HAPPEN IN TIME OTHERWISE...
        def _sync_es():
            se.es.indices.refresh(index="test_resources")
        def _apply_s(activity_id):
            SetApplicator(False, True).apply_sets(activity_id)

        framework = self.FRAMEWORK()
        framework.recalculate_table()

        admin = Person()
        ash = admin.name.append()
        ash.full_name = "Ash"
        admin.user_account = self.user
        admin.save()

        activity = Activity.create()
        activity.save()

        resource = activity._.resource

        # The user is now attached to a Person.
        # They have not yet got any nodegroup _or_ resource instance rights.

        implicit_permission = framework.user_can_read_resource(admin.user_account, str(activity.id))
        framework.recalculate_table()
        self.assertFalse(implicit_permission)

        # We give them nodegroup rights. In the casbin context, this should make
        # no visible difference yet, as they have no entitlement that includes this
        # resource instance.

        framework.assign_perm("view_resourceinstance", self.group, resource)
        framework.recalculate_table()

        implicit_permission = framework.user_can_read_resource(admin.user_account, str(activity.id))
        self.assertFalse(implicit_permission)

        # We put the resource (an Activity) in the Root Set.
        st = Set.find(GROUPINGS["permissions"]["root_group"])
        st.members.append(activity)
        st.save()

        # Ensure that the set membership appears in Elasticsearch.
        _apply_s(activity.id)

        # We add the Person to the Root Group.
        gp = ArchesGroup.find(GROUPINGS["groups"]["root_group"])
        gp.members.append(admin)
        gp.save()

        # We give the Root Set permissions (RW) to the Root Set member tree.
        permission = gp.permissions.append()
        permission.object = st
        PermissionType = permission.action.__collection__
        permission.action.append(PermissionType.Reading)
        permission.action.append(PermissionType.Writing)
        gp.save()

        # Ensure that ES has indexed everything.
        _sync_es()

        framework.recalculate_table()

        # The user now has nodegroup _and_ resource instance permissions.
        # person -> Root Group -> Root Set -> activity
        can_access_with_view_permission = framework.user_can_read_resource(admin.user_account, activity.id)
        self.assertTrue(can_access_with_view_permission)

        # We create a nested set under the original set and a second activity.
        subset = Set.create()
        subactivity = Activity.create()
        subset.members.append(subactivity)
        subactivity.save()
        _sync_es()

        # If this set is not nested under the Root Set, the user does not yet
        # have any permissions to its members.
        cannot_access_if_not_nested = framework.user_can_read_resource(admin.user_account, subactivity.id)
        self.assertFalse(cannot_access_if_not_nested)

        st.nested_sets.append(subset)
        subset.save()
        st.save()
        _sync_es()

        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        # Once nested, they do.
        can_access_if_nested = framework.user_can_read_resource(admin.user_account, subactivity.id)
        self.assertTrue(can_access_if_nested)

        # Add a subgroup
        sg = ArchesGroup.create()
        team_member = Person.create()
        team_member.user_account = User.objects.get(username="jim")
        team_member.save()
        sg.members.append(team_member)
        sg.save()
        gp.members.append(sg)
        gp.save()

        _sync_es()
        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        # The team member cannot access either activity, as the permission lives in the root group.
        cannot_access_if_not_in_root_group = framework.user_can_read_resource(team_member.user_account, activity.id)
        self.assertFalse(cannot_access_if_not_in_root_group)
        cannot_access_if_not_in_root_group  = framework.user_can_read_resource(team_member.user_account, subactivity.id)
        self.assertFalse(cannot_access_if_not_in_root_group)

        # Remove the primary permission
        gp.permissions.pop()
        gp.save()

        _sync_es()
        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        cannot_access_if_no_permission = framework.user_can_read_resource(admin.user_account, activity.id)
        self.assertFalse(cannot_access_if_no_permission)
        cannot_access_if_no_permission = framework.user_can_read_resource(admin.user_account, subactivity.id)
        self.assertFalse(cannot_access_if_no_permission)

        # We give the Root Set permissions (RW) to the subgroup member tree.
        permission = sg.permissions.append()
        st = Set.find(GROUPINGS["permissions"]["root_group"])
        permission.object = st
        PermissionType = permission.action.__collection__
        permission.action.append(PermissionType.Reading)
        permission.action.append(PermissionType.Writing)
        sg.save()

        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        # This should give permissions to both users to both the activity and subactivity.
        can_access_if_subgroup_permission = framework.user_can_read_resource(admin.user_account, activity.id)
        self.assertTrue(can_access_if_subgroup_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(admin.user_account, subactivity.id)
        self.assertTrue(can_access_if_subgroup_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(team_member.user_account, activity.id)
        self.assertTrue(can_access_if_subgroup_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(team_member.user_account, subactivity.id)
        self.assertTrue(can_access_if_subgroup_permission)

        # Remove the primary permission
        sg.permissions.pop()
        sg.save()

        _sync_es()
        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        cannot_access_if_no_permission = framework.user_can_read_resource(team_member.user_account, activity.id)
        self.assertFalse(cannot_access_if_no_permission)
        cannot_access_if_no_permission = framework.user_can_read_resource(team_member.user_account, subactivity.id)
        self.assertFalse(cannot_access_if_no_permission)

        # Add a permission to the subset.
        permission = sg.permissions.append()
        # FIXME: until we can safely re-parent.
        subset = Set.find(subset.id)
        permission.object = subset
        PermissionType = permission.action.__collection__
        permission.action.append(PermissionType.Reading)
        permission.action.append(PermissionType.Writing)
        sg.save()

        _sync_es()
        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        # This should give permissions to both users to only the subactivity.
        cannot_access_if_no_permission = framework.user_can_read_resource(admin.user_account, activity.id)
        self.assertFalse(cannot_access_if_no_permission)
        cannot_access_if_no_permission = framework.user_can_read_resource(team_member.user_account, activity.id)
        self.assertFalse(cannot_access_if_no_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(admin.user_account, subactivity.id)
        self.assertTrue(can_access_if_subgroup_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(team_member.user_account, subactivity.id)
        self.assertTrue(can_access_if_subgroup_permission)

        # Add the original permission back, from the Root Group to the Root Set.
        permission = gp.permissions.append()
        st = Set.find(GROUPINGS["permissions"]["root_group"])
        permission.object = st
        PermissionType = permission.action.__collection__
        permission.action.append(PermissionType.Reading)
        permission.action.append(PermissionType.Writing)
        gp.save()

        _sync_es()
        _apply_s(activity.id)
        _apply_s(subactivity.id)

        framework.recalculate_table()

        # This should give permissions to both users to only the subactivity.
        can_access_if_full_permission = framework.user_can_read_resource(admin.user_account, activity.id)
        self.assertTrue(can_access_if_full_permission)
        cannot_access_if_no_permission = framework.user_can_read_resource(team_member.user_account, activity.id)
        self.assertFalse(cannot_access_if_no_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(admin.user_account, subactivity.id)
        self.assertTrue(can_access_if_subgroup_permission)
        can_access_if_subgroup_permission = framework.user_can_read_resource(team_member.user_account, subactivity.id)
        self.assertTrue(can_access_if_subgroup_permission)

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

        from arches_orm import wkrm
        wkrm.resource_models = {}
        from arches_orm import models
        models.reload()

        import coral.permissions.casbin
        import coral.utils.casbin
        importlib.reload(coral.permissions.casbin)
        importlib.reload(coral.utils.casbin)

        cls.FRAMEWORK = coral.permissions.casbin.CasbinPermissionFramework

        Activity = models.Activity
        Person = models.Person
        Organization = models.Organization
        Set = models.Set
        LogicalSet = models.LogicalSet
        ArchesGroup = models.Group
