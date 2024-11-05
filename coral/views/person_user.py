import logging
from django.urls import reverse
from django.utils.http import urlencode
from arches.app.utils.arches_crypto import AESCipher
from arches.app.views.base import BaseManagerView
from arches.app.utils.response import JSONResponse
from arches.app.models.system_settings import settings
from arches.app.utils.permission_backend import user_can_edit_resource, user_is_resource_editor, user_is_resource_reviewer, user_is_resource_exporter
from arches_orm.adapter import admin
from coral.models.models import RegistrationLink

logger = logging.getLogger(__name__)

class PersonUserSignupView(BaseManagerView):
    def _can_get_link(self, user, person_id):
        success = False
        if (
                person_id and user_can_edit_resource(user, resourceid=person_id)
        ):
            success = True
        return success

    def get(self, request):
        person_id = request.GET.get("personId", None)
        return JSONResponse({
            "success": self._can_get_link(request.user, person_id)
        })

    def post(self, request):
        person_id = request.POST.get("personId", [])
        if not self._can_get_link(request.user, person_id):
            raise Exception({
                "error": "Could not issue a sign-link for the current user to this person"
            })

        from arches_orm.models import Person

        groups = []
        # If, for some reason, a user is allowed to create a sign-up links
        # without being an admin, at least make sure they don't exceed their
        # own privileges.
        if user_is_resource_editor(request.user):
            groups.append("Resource Editor")
        if user_is_resource_reviewer(request.user):
            groups.append("Resource Reviewer")
        if user_is_resource_exporter(request.user):
            groups.append("Resource Exporter")
        if not groups:
            groups = [settings.USER_SIGNUP_GROUP]

        with admin():
            person = Person.find(person_id)
        if not person:
            raise (Exception(("User can only be signed up by linking to a pre-known Person.")))

        AES = AESCipher(settings.SECRET_KEY)
        link = RegistrationLink()
        link.person = person._.resource
        link.metadata = {
            "groups": groups,
        }
        link.save()
        encrypted_person_id = AES.encrypt(f"{person.id}:{link.registrationlinkid}")
        url_encrypted_data = urlencode({"person": encrypted_person_id})
        user_signup_link = request.build_absolute_uri(reverse("person-signup") + "?" + url_encrypted_data)

        return JSONResponse({
            "userSignupLink": user_signup_link
        })
