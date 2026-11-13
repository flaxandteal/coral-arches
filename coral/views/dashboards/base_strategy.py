class TaskStrategy():
    def get_tasks(self, groupId, userResourceId, sort_by, sort_order, filter):
        raise NotImplementedError("Subclasses must implement this method")
    def get_default_sort_order(self):
        return "desc"
    def build_data(self, resource_id, groupId, prefetched):
        """`prefetched` holds what this strategy loaded for the whole page, by name."""
        raise NotImplementedError("Subclasses must implement this method")