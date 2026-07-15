"""alizarin_django.view_models — surface matching arches_orm.view_models.

The submodules (concepts, node_list, semantic, string, resources) exist as
real modules so that import paths like
`alizarin_django.view_models.concepts.ConceptValueViewModel` work the same
way they did under arches_orm. The package-level re-exports below also
support `from alizarin_django.view_models import X`.
"""

from __future__ import annotations

from ._base import ViewModel
from .concepts import (
    ConceptListValueViewModel,
    ConceptValueViewModel,
    EmptyConceptValueViewModel,
)
from .node_list import NodeListViewModel
from .resources import (
    RelatedResourceInstanceListViewModel,
    ResourceInstanceViewModel,
)
from .semantic import SemanticViewModel
from .string import StringViewModel

__all__ = [
    "ViewModel",
    "ConceptValueViewModel",
    "ConceptListValueViewModel",
    "EmptyConceptValueViewModel",
    "NodeListViewModel",
    "ResourceInstanceViewModel",
    "RelatedResourceInstanceListViewModel",
    "SemanticViewModel",
    "StringViewModel",
]
