from arches.app.models import models
from arches.app.models.resource import Resource
from arches_orm.adapter import admin
import logging

class NotificationStrategy():
    def __init__(self, request):
        self.request = request

    def send_notification(self, user, tile):
        raise NotImplementedError("Subclasses should implement this method")

    def get_resource_details(self, tile, remove_prefix=None, remove_suffix=None):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        name = Resource.objects.get(pk=resource_instance_id).displayname()
        if remove_prefix:
            name = name.removeprefix(remove_prefix).strip()
        if remove_suffix:
            name = name.removesuffix(remove_suffix).strip()
        return  name, resource_instance_id
    
    def create_notification(self, message, name, resource_instance_id, response_slug, notiftype_id=None, email=False):
        self._delete_existing_notification(resource_instance_id)
        notification = models.Notification(
                    message = message,
                    context = {
                        "resource_instance_id": resource_instance_id,
                        "resource_id": name,
                        "response_slug": response_slug
                    },
                    notiftype_id = notiftype_id
                )
        
        if email:
            link = self._build_url()
            email_params = {
                "greeting": message,
                "email": "", 
                "salutation": "Hi",
                "username": "", 
                "link": link,
                "button_text": "Open Arches"
            }
            notification.context.update(email_params)
                        
        notification.save()
        return notification
    
    def notify_groups(self, user, group_list, notification):
        from arches_orm.models import Group, Person
        with admin():
            for group_id in group_list:
                group = Group.find(group_id)
                person_list = [Person.find(member.id) for member in group.members if isinstance(member, Person)]
                
                for person in person_list:
                    if user is None or person != user:
                        
                        self.notify_user(person, notification)
        
    def notify_user(self, user, notification):
        user = user.user_account

        if 'email' in notification.context:
            notification = self.update_email_details(notification, user)

        user_x_notification = models.UserXNotification(
            notif = notification,
            recipient = user
        )
        user_x_notification.save()

    def update_email_details(self, notification, user):
        notification.context['username'] = user.username
        notification.context['email'] = user.email
        return notification
    
    def _build_url(self):
        return self.request.build_absolute_uri(f"/index.htm")
    
    def get_domain_value_string(self, value_id, node_id):
        node = models.Node.objects.filter(
            pk = node_id,   
        ).first()
        options = node.config.get("options")
        value_string = next((option.get("text").get("en") for option in options if option.get("id") == value_id), None)
        return value_string

    def _delete_existing_notification(self, resource_instance_id):
        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=resource_instance_id
        ).first()

        if existing_notification:
            existing_notification.delete()
            logging.info("Deleted Existing Notification")