"""Django group datatype — port of arches_orm.arches_django.datatypes.django_group.

coral-arches uses `MissingDjangoGroupViewModel` as an isinstance target in
permissions/casbin.py to detect groups that could not be resolved.
"""

from __future__ import annotations

import logging

from django.contrib.auth.models import Group

from ...view_models._base import ViewModel

logger = logging.getLogger(__name__)


class DjangoGroupViewModel(Group, ViewModel):
    class Meta:
        proxy = True
        app_label = "alizarin_django"
        db_table = Group.objects.model._meta.db_table

    def __bool__(self) -> bool:
        return bool(self.pk)


class MissingDjangoGroupViewModel(Group, ViewModel):
    class Meta:
        app_label = "alizarin_django"
