from django.apps import AppConfig


class CoralConfig(AppConfig):
    name = "coral"
    is_arches_application = True

    def ready(self):
        _patch_arches_search_indexing_factory()


def _patch_arches_search_indexing_factory():
    """Work around an arches_search IndexingFactory import bug.

    arches_search (through at least 0.1.0a11) loads each indexer module in
    ``IndexingFactory.__init__`` via ``importlib.util.spec_from_file_location``
    and registers an *empty* placeholder module in ``sys.modules`` before it is
    executed. The ``*_list.py`` indexers import a class from their sibling base
    module at import time (e.g. ``from ...indexers.concept import
    ConceptIndexing``); when that sibling is still an unexecuted placeholder the
    import fails with ``cannot import name 'ConceptIndexing'``. Because this
    factory runs from the search-indexing function's ``post_save``, it breaks
    *every* tile save in the app.

    Replacing the loader with the normal import machinery
    (``importlib.import_module``) resolves the sibling imports safely. This is a
    temporary shim until the fix lands upstream; drop it once arches_search is
    bumped to a release that no longer pre-registers placeholder modules.
    """
    try:
        import importlib
        import inspect
        from pathlib import Path

        from arches_search.indexing import indexing_factory
    except Exception:
        # arches_search not installed / not importable at startup — nothing to do.
        return

    def patched_init(self):
        indexers_dir = Path(indexing_factory.__file__).parent / "indexers"
        for module in indexers_dir.glob("*.py"):
            if module.name == "__init__.py":
                continue
            module_name = "arches_search.indexing.indexers.{}".format(module.stem)
            py_module = importlib.import_module(module_name)
            for name in dir(py_module):
                obj = getattr(py_module, name)
                if inspect.isclass(obj) and obj.__module__ == module_name:
                    indexer = obj()
                    self.registry[indexer.datatype.datatype_name] = indexer

    indexing_factory.IndexingFactory.__init__ = patched_init
