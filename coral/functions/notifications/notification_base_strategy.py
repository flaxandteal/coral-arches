from arches.app.models import models
from arches.app.models.resource import Resource
from arches_orm.adapter import admin
import logging

class NotificationStrategy():
    def __init__(self, tile, request, user, config):
        self.request = request
        self.tile = tile
        self.resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        self.user = user
        self.config = config
        self.name = self.get_resource_name(self.config.get('remove_prefix', None), self.config.get('remove_suffix', None))
        self.notification = self.create_notification()

    def send_notification(self):
        check_prefix = self.config.get('check_prefix', None)

        if check_prefix and not self.name.startswith(check_prefix):
            return
                                
        self.notify_groups()

    def get_resource_name(self, remove_prefix=None, remove_suffix=None):
        name = Resource.objects.get(pk=self.resource_instance_id).displayname()

        if name and remove_prefix:
            name = name.removeprefix(remove_prefix).strip()
        if name and remove_suffix:
            name = name.removesuffix(remove_suffix).strip()
        return  name
    
    def create_notification(self):
        self._delete_existing_notification()

        message_template = self.config.get('message', None)
        message = message_template.format(name=self.name) if message_template else None

        notification = models.Notification(
                    message = message,
                    context = {
                        "resource_instance_id": self.resource_instance_id,
                        "resource_id": self.name,
                        "response_slug": self.config.get('response_slug', None)
                    },
                    notiftype_id = self.config.get('notiftype_id', None)
                )
        
        if self.config.get('email', None):
            link = self._build_url()
            email_params = {
                "greeting": self.config.get('message', None),
                "email": "", 
                "salutation": "Hi",
                "username": "", 
                "link": link,
                "button_text": "Open Arches"
            }
            notification.context.update(email_params)
                        
        notification.save()
        return notification
    
    def notify_groups(self):
        from arches_orm.models import Group, Person
        with admin():
            group_list = self.config.get('groups_to_notify', None)
            for group_id in group_list:
                group = Group.find(group_id)
                person_list = [Person.find(member.id) for member in group.members if isinstance(member, Person)]
                
                for person in person_list:
                    if self.user is None or person != self.user:
                        self.notify_user(person)
        
    def notify_user(self, person):
        user = person.user_account

        if 'email' in self.notification.context:
            self.update_email_details(user)

        user_x_notification = models.UserXNotification(
            notif = self.notification,
            recipient = user
        )
        user_x_notification.save()

    def update_email_details(self, user):
        self.notification.context['username'] = user.username
        self.notification.context['email'] = user.email
    
    def _build_url(self):
        return self.request.build_absolute_uri(f"/index.htm")
    
    def get_domain_value_string(self, value_id, node_id):
        node = models.Node.objects.filter(
            pk = node_id,   
        ).first()
        options = node.config.get("options")
        value_string = next((option.get("text").get("en") for option in options if option.get("id") == value_id), None)
        return value_string

    def _delete_existing_notification(self):
        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=self.resource_instance_id
        ).first()

        if existing_notification:
            existing_notification.delete()
            logging.info("Deleted Existing Notification")