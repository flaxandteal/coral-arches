"""Base ViewModel class — mirrors arches_orm.view_models._base."""

from __future__ import annotations


class ViewModel:
    """Marker base class for all alizarin_django view models.

    Matches arches_orm.view_models._base.ViewModel so isinstance checks and
    metaclass behaviour stay compatible with code migrated from arches_orm.
    """

    _parent_node = None
    _parent_pseudo_node = None
