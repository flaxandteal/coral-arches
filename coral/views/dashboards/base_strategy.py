class TaskStrategy():
    def get_tasks(self, groupId, userResourceId, sort_by, sort_order, filter):
        raise NotImplementedError("Subclasses must implement this method")
    def build_data(self, resource, groupId):
        raise NotImplementedError("Subclasses must implement this method")