import logging
from django.urls import reverse
from django.utils.http import urlencode
from arches.app.utils.arches_crypto import AESCipher
from arches.app.views.base import BaseManagerView
from arches.app.utils.response import JSONResponse
from arches.app.models.system_settings import settings

from coral.resource_model_wrappers import Person

logger = logging.getLogger(__name__)

class PersonUserSignupView(BaseManagerView):
    def get(self, request):
        person_id = request.GET.get("personId", []);

        person = Person.find(person_id)
        logger.error(str(person.id))

        AES = AESCipher(settings.SECRET_KEY)
        encrypted_person_id = AES.encrypt(str(person.id))
        url_encrypted_person_id = urlencode({"person": encrypted_person_id})
        user_signup_link = request.build_absolute_uri(reverse("person-signup") + "?" + url_encrypted_person_id)

        return JSONResponse({
            "userSignupLink": user_signup_link
        })
