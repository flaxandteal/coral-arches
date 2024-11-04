import uuid
from django.contrib.gis.db import models
from django.db.models import JSONField, deletion
from arches.app.models.models import ResourceInstance

class RegistrationLink(models.Model):
    registrationlinkid = models.UUIDField(default=uuid.uuid1, primary_key=True, serialize=False)
    person = models.ForeignKey(ResourceInstance, db_column="person_id", on_delete=deletion.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    used = models.DateTimeField(null=True)
    metadata = JSONField(blank=True, db_column="metadata", null=True)

    def __init__(self, *args, **kwargs):
        super(RegistrationLink, self).__init__(*args, **kwargs)
        if not self.registrationlinkid:
            self.registrationlinkid = uuid.uuid4()

    class Meta:
        managed = True
        db_table = "registration_links"

