"""UserViewModel — Django User proxy kept for isinstance compatibility."""

from __future__ import annotations

import logging

from django.contrib.auth.models import User

from ...view_models._base import ViewModel

logger = logging.getLogger(__name__)


class UserViewModel(User, ViewModel):
    class Meta:
        proxy = True
        app_label = "alizarin_django"
        db_table = User.objects.model._meta.db_table

    def __bool__(self) -> bool:
        return bool(self.pk)
