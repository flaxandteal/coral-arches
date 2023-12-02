"""
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

import base64
import io

from django.http import response
from arches.app.utils.external_oauth_backend import ExternalOauthAuthenticationBackend
import qrcode
import pyotp
import time
import requests
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.http.response import HttpResponseForbidden
from django.template.loader import render_to_string
from django.views.generic import View
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.utils.html import strip_tags
from django.utils.translation import gettext_lazy as _
from django.utils.http import urlencode
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth import views as auth_views
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.contrib.sessions.models import Session
from django.shortcuts import render, redirect
from django.core.exceptions import ValidationError
import django.contrib.auth.password_validation as validation
from arches import __version__
from arches.app.utils.response import JSONResponse, Http401Response
from coral.utils.forms import CoralUserCreationForm
from arches.app.models import models
from arches.app.models.system_settings import settings
from arches.app.utils.arches_crypto import AESCipher
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from arches.app.utils.permission_backend import user_is_resource_reviewer
from django.core.exceptions import ValidationError
from arches.app.views.auth import *
from coral.resource_model_wrappers import Person
import logging

logger = logging.getLogger(__name__)

def _person_decrypt(person):
    if not person:
        raise (Exception(("User can only be signed up by linking to a pre-known Person.")))

    AES = AESCipher(settings.SECRET_KEY)
    try:
        person_id = AES.decrypt(person)
    except Exception:
        raise (Exception(("User can only be signed up by linking to a pre-known Person with encrypted ID.")))

    person = Person.find(person_id)
    if not person:
        raise (Exception(("User can only be signed up by linking to a pre-known Person.")))

    return person

@method_decorator(never_cache, name="dispatch")
class PersonSignupView(View):
    def get(self, request):
        form = CoralUserCreationForm(enable_captcha=False)
        postdata = {"first_name": "", "last_name": "", "email": ""}
        showform = True
        confirmation_message = ""

        if not settings.ENABLE_PERSON_USER_SIGNUP:
            raise (Exception(("User signup has been disabled. Please contact your administrator.")))

        person = request.GET.get("person", "")
        logger.error(str(_person_decrypt(person)))

        return render(
            request,
            "signup.htm",
            {
                "enable_captcha": settings.ENABLE_CAPTCHA,
                "form": form,
                "postdata": postdata,
                "showform": showform,
                "person_enc": person,
                "confirmation_message": confirmation_message,
                "validation_help": validation.password_validators_help_texts(),
            },
        )

    def post(self, request):
        showform = True
        confirmation_message = ""
        postdata = request.POST.copy()
        postdata["ts"] = int(time.time())
        form = CoralUserCreationForm(postdata, enable_captcha=settings.ENABLE_CAPTCHA)

        person = postdata.get("person_enc", "")
        _person_decrypt(person)

        if not settings.ENABLE_PERSON_USER_SIGNUP:
            raise (Exception(("User signup has been disabled. Please contact your administrator.")))

        if form.is_valid():
            AES = AESCipher(settings.SECRET_KEY)
            form.cleaned_data["person_enc"] = person
            userinfo = JSONSerializer().serialize(form.cleaned_data)
            encrypted_userinfo = AES.encrypt(userinfo)
            url_encrypted_userinfo = urlencode({"link": encrypted_userinfo})
            confirmation_link = request.build_absolute_uri(reverse("person-confirm-signup") + "?" + url_encrypted_userinfo)

            if not settings.FORCE_USER_SIGNUP_EMAIL_AUTHENTICATION:  # bypasses email confirmation if setting is disabled
                return redirect(confirmation_link)

            admin_email = settings.ADMINS[0][1] if settings.ADMINS else ""
            email_context = {
                "button_text": ("Signup for Arches"),
                "link": confirmation_link,
                "greeting": (
                    "Thanks for your interest in Arches. Click on link below \
                    to confirm your email address! Use your email address to login."
                ),
                "closing": (
                    "This link expires in 24 hours.  If you can't get to it before then, \
                    don't worry, you can always try again with the same email address."
                ),
            }

            html_content = render_to_string("email/general_notification.htm", email_context)  # ...
            text_content = strip_tags(html_content)  # this strips the html, so people will have the text as well.

            # create the email, and attach the HTML version as well.
            msg = EmailMultiAlternatives(("Welcome to Arches!"), text_content, admin_email, [form.cleaned_data["email"]])
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            confirmation_message = (
                "An email has been sent to <br><strong>%s</strong><br> with a link to activate your account" % form.cleaned_data["email"]
            )
            showform = False

        return render(
            request,
            "signup.htm",
            {
                "enable_captcha": settings.ENABLE_CAPTCHA,
                "form": form,
                "postdata": postdata,
                "showform": showform,
                "person_enc": person,
                "confirmation_message": confirmation_message,
                "validation_help": validation.password_validators_help_texts(),
            },
        )


@method_decorator(never_cache, name="dispatch")
class PersonConfirmSignupView(View):
    def get(self, request):
        if not settings.ENABLE_PERSON_USER_SIGNUP:
            raise (Exception(("User signup has been disabled. Please contact your administrator.")))

        link = request.GET.get("link", None)
        AES = AESCipher(settings.SECRET_KEY)
        userinfo = JSONDeserializer().deserialize(AES.decrypt(link))

        person = userinfo["person_enc"]
        person = _person_decrypt(person)
        del userinfo["person_enc"]

        form = CoralUserCreationForm(userinfo)
        logger.error("INVALID0")
        if datetime.fromtimestamp(userinfo["ts"]) + timedelta(days=1) >= datetime.fromtimestamp(int(time.time())):
            logger.error("INVALID1")
            if form.is_valid():
                logger.error("INVALID2")
                user = form.save()
                logger.error(user.pk)
                person.user_account = user.pk
                person.save()
                crowdsource_editor_group = Group.objects.get(name=settings.USER_SIGNUP_GROUP)
                user.groups.add(crowdsource_editor_group)
                return redirect(reverse("auth") + "?registration_success=true")
            else:
                logger.error("INVALID")
                try:
                    for error in form.errors.as_data()["username"]:
                        if error.code == "unique":
                            return redirect("auth")
                except:
                    pass
        else:
            logger.error("INVALID3")
            form.errors["ts"] = [("The signup link has expired, please try signing up again.  Thanks!")]
        logger.error("INVALID4")

        return render(
            request,
            "signup.htm",
            {"form": form, "showform": True, "postdata": userinfo, "validation_help": validation.password_validators_help_texts()},
        )
