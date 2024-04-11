from django.contrib.auth.models import User
from arches.app.utils.forms import ArchesUserCreationForm

class CoralUserCreationForm(ArchesUserCreationForm):
    # Remove name fields
    first_name = None
    last_name = None

    class Meta:
        model = User
        fields = ("email", "username", "ts")
