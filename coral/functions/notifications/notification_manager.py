class NotificationManager():
    def __init__(self, node_group_id, user, tile, strategy_registry):
        if not strategy_registry:
            raise ValueError("A strategy register must be provided")
        self.user = user
        self.node_group_id = node_group_id
        self.tile = tile
        self.strategy_registry = strategy_registry
        self.strategy = self._select_strategy(node_group_id)
        # self.strategy.delete_existing_notification(tile)

    def _select_strategy(self, node_group_id):
        strategy_class = self.strategy_registry.get(node_group_id)
        if strategy_class:
            return strategy_class()
        else:
            raise ValueError(f"No strategy found for node group id: {node_group_id}")
        
    def notify(self):
        self.strategy.send_notification(self.user, self.tile)