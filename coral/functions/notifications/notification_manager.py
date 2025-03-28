from coral.functions.notifications.notification_base_strategy import NotificationStrategy
from arches_orm.adapter import admin
class NotificationManager():
    def __init__(self, tile, strategy_registry, request):
        from arches_orm.models import Person
        with admin():
            if not strategy_registry:
                raise ValueError("A strategy register must be provided")
            self.request = request
            persons = Person.where(user_account=request.user.id) if request.user else []
            self.user = persons[0] if persons else None
            self.tile = tile
            self.node_group_id = str(tile.nodegroup_id)
            self.strategy_registry = strategy_registry
            self.strategy = self._select_strategy()

    def _select_strategy(self):
        settings = self.strategy_registry.get(self.node_group_id)
        strategy_class = settings.get('strategy', None)
        config = settings.get('config', None)

        if strategy_class:
            return strategy_class(self.tile, self.request, self.user, config)
        else:
            return NotificationStrategy(self.tile, self.request, self.user, config)
        
    def notify(self):
        self.strategy.send_notification()