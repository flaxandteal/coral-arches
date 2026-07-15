"""Re-export of alizarin_django's QueryBuilder.

Import path kept identical to arches_orm so migrated code can do:
    from alizarin_django.arches_django.query_builder.query_builder import QueryBuilder
"""

from ...wrapper import QueryBuilder

__all__ = ["QueryBuilder"]
