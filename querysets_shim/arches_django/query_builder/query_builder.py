"""Re-export of querysets_shim's QueryBuilder.

Import path kept identical to arches_orm so migrated code can do:
    from querysets_shim.arches_django.query_builder.query_builder import QueryBuilder
"""

from ...wrapper import QueryBuilder

__all__ = ["QueryBuilder"]
