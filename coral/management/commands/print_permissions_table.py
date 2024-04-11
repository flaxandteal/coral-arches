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
import readline
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group as DjangoGroup
from arches.app.utils.permission_backend import assign_perm
from arches.app.models.system_settings import settings
from arches.app.models.resource import Resource
from arches_orm.utils import attempt_well_known_resource_model
from arches_orm.models import Group, Set
from coral.permissions.casbin import CasbinPermissionFramework

logging.basicConfig()

class Command(BaseCommand):
    """
    Commands for adding arches test users

    """

    def add_arguments(self, parser):
        ... # parser.add_argument("operation", nargs="?")

    def handle(self, *args, **options):
        table = self.get_table()

    def get_table(self):
        framework = CasbinPermissionFramework()
        enforcer = framework._enforcer
        enforcer.load_policy()
        logging.disable(logging.NOTSET)
        enforcer.model.logger.setLevel(logging.INFO)
        framework.recalculate_table()
        enforcer.model.print_policy()
        #group_tree = {}
        #set_tree = {}
        #group_x_set = []
        #att = lambda key: attempt_well_known_resource_model(key.split(":", 1)[1])
        #for key, ast in enforcer.model["p"].items():
        #    for policy in ast.policy:
        #        if isinstance(policy, list) and len(policy) == 3:
        #            group_x_set.append((att(policy[0]), att(policy[1]), Group.make_concept(policy[2])))

        #print("GROUP === ACTION ===> SET")
        #for grp, st, act in group_x_set:
        #    print(grp.name, "----", act.text, "---->", st.title_text)

        #for sec in ["g"]:
        #    if sec not in enforcer.model.keys():
        #        print("Sec not found", sec)
        #        continue

        #    for key, ast in enforcer.model[sec].items():
        #        for policy in ast.policy:
        #            prnt = att(policy[1])
        #            group_tree.setdefault(prnt.id, {"children": [], "ri": prnt, "has_parent": False})
        #            group_tree[prnt.id].setdefault("children", [])
        #            prefix = policy[0].split(":", 1)[0]
        #            if prefix in ("ri", "g", "g2", "g2l"):
        #                try:
        #                    chld = att(policy[0])
        #                except Resource.DoesNotExist:
        #                    logging.error("Missing %s", policy[0])
        #                else:
        #                    group_tree.setdefault(chld.id, {"ri": chld})
        #                    group_tree[chld.id]["has_parent"] = True
        #                    group_tree[prnt.id]["children"].append(group_tree[chld.id])
        #            elif prefix == "u":
        #                group_tree[prnt.id]["children"].append(User.objects.get(pk=int(policy[0][2:])))
        #            else:
        #                group_tree[prnt.id]["children"].append(policy[0])
        #def _print_children(node, level):
        #    for child in node["children"]:
        #        if isinstance(child, dict):
        #            print(" " * 2 * level, child["ri"]._model_name, str(child["ri"]))
        #            if "children" in child:
        #                _print_children(child, level + 1)
        #            elif child["ri"]._model_name not in ("Group", "Set"):
        #                print(" " * 2 * level, "\_", child["ri"].id)
        #        elif isinstance(child, User):
        #            print(" " * 2 * level, "User:", child.email)
        #        else:
        #            print(" " * 2 * level, "Unknown:", child)

        #print()

        #for root in (node for node in group_tree.values() if not node["has_parent"]):
        #    print("Root:", root["ri"]._model_name, str(root["ri"]))
        #    _print_children(root, 1)

        #last_user = None
        #last_permission = None
        #last_entity = None
        #while (user := input("User: ")) != "q":
        #    if not user:
        #        if last_user:
        #            user = last_user
        #        else:
        #            break
        #    else:
        #        try:
        #            user = User.objects.get(email__startswith=user)
        #        except User.MultipleObjectsReturned:
        #            print("[Found multiple matches, try again]")
        #            continue
        #    print(user, user.email, user.id)
        #    print(user.is_authenticated)

        #    entity = input("Entity: ")
        #    if not entity:
        #        if last_entity:
        #            entity = last_entity
        #        else:
        #            break
        #    else:
        #        try:
        #            entity = Resource.objects.get(resourceinstanceid__startswith=entity)
        #        except User.MultipleObjectsReturned:
        #            print("[Found multiple matches, try again]")
        #            continue
        #    ri = attempt_well_known_resource_model(entity.pk)

        #    permission = input("Permission: ")
        #    if not permission:
        #        if last_permission:
        #            permission = last_permission
        #        else:
        #            break
        #    result = framework.check_resource_instance_permissions(user, ri.id, permission)
        #    print(result)

        #    last_user = user
        #    last_permission = permission
        #    last_entity = entity
