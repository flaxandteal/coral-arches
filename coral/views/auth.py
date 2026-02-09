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

import time
import logging
import json
from datetime import datetime, timedelta
from django.template.loader import render_to_string
from django.views.generic import View, FormView
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.utils.html import strip_tags
from django.utils.translation import gettext_lazy as _
from django.utils.http import urlencode
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse
from django.contrib.auth.models import Group
from django.shortcuts import render, redirect
import django.db.utils
import django.contrib.auth.password_validation as validation
from arches import __version__
from coral.utils.forms import CoralUserCreationForm
from arches.app.models.system_settings import settings
from arches.app.utils.arches_crypto import AESCipher
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from arches_orm.adapter import admin
from coral.models.models import RegistrationLink
from django_otp import user_has_device
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.plugins.otp_static.models import StaticDevice, StaticToken
from django.contrib.auth import authenticate, login as auth_login, logout
from two_factor.views import SetupView as BaseSetupView, BackupTokensView
from two_factor.forms import TOTPDeviceForm
from qrcode.image.svg import SvgPathImage
import qrcode

logger = logging.getLogger(__name__)


class Reset2FAView(View):
    """View to reset user's 2FA - deletes devices and logs user out"""
    
    def post(self, request):
        if not request.user.is_authenticated:
            return redirect('auth')
        
        TOTPDevice.objects.filter(user=request.user).delete()
        StaticDevice.objects.filter(user=request.user).delete()
        
        logout(request)
        
        return redirect('auth')


BACKUP_CODE_COUNT = 10


class BackupCodesView(BackupTokensView):
    template_name = 'two_factor_backup_codes.htm'
    success_url = 'two_factor_backup_codes'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('auth')
        
        if not TOTPDevice.objects.filter(user=request.user, confirmed=True).exists():
             return redirect('user_profile_manager')

        self.device, created = StaticDevice.objects.get_or_create(
            user=request.user,
            name='backup',
        )

        return FormView.dispatch(self, request, *args, **kwargs)

    def form_valid(self, form):
        self.device.token_set.all().delete()
        
        import random
        import string
        codes = []
        for _ in range(BACKUP_CODE_COUNT):
             code = ''.join(random.choices(string.digits, k=8))
             StaticToken.objects.create(device=self.device, token=code)
             codes.append(code)
        
        return render(
            self.request,
            self.template_name,
            {
                'codes': codes,
                'has_codes': True,
                'just_generated': True,
                'remaining_count': len(codes),
            }
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.device:
             count = self.device.token_set.count()
             context['remaining_count'] = count
             context['has_codes'] = count > 0
        return context


class SetupView(BaseSetupView):    
    def get(self, request, *args, **kwargs):
        user_id = request.session.get('2fa_pending_user_id')
        
        if not user_id:
            return redirect('auth')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            return redirect('auth')
        
        timestamp = request.session.get('2fa_timestamp', 0)
        timeout = getattr(settings, 'TWO_FACTOR_LOGIN_TIMEOUT', 600)
        if timeout and (time.time() - timestamp) > timeout:
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            return redirect('auth')

        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        if not device:
            device = TOTPDevice.objects.create(
                user=user,
                name='default',
                confirmed=False
            )

        otpauth_url = device.config_url
        
        img = qrcode.make(otpauth_url, image_factory=SvgPathImage)
        from io import BytesIO
        stream = BytesIO()
        img.save(stream)
        qr_code_svg = stream.getvalue().decode('utf-8')
        
        return render(
            request,
            'two_factor_setup.htm',
            {
                'device': device,
                'qr_code': qr_code_svg,
                'secret_key': device.key,
                'next': request.session.get('2fa_pending_next', reverse('home')),
            }
        )
    
    def post(self, request, *args, **kwargs):
        """Handle OTP verification to complete setup"""
        user_id = request.session.get('2fa_pending_user_id')
        
        if not user_id:
            return redirect('auth')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            return redirect('auth')
        
        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        if not device:
            return redirect('auth')

        token = request.POST.get('token', '').strip()
        
        if device.verify_token(token):
            device.confirmed = True
            device.save()
            
            next_url = request.session.get('2fa_pending_next', reverse('home'))
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            return redirect(next_url)
        
        otpauth_url = device.config_url
        img = qrcode.make(otpauth_url, image_factory=SvgPathImage)
        from io import BytesIO
        stream = BytesIO()
        img.save(stream)
        qr_code_svg = stream.getvalue().decode('utf-8')
        
        return render(
            request,
            'two_factor_setup.htm',
            {
                'device': device,
                'qr_code': qr_code_svg,
                'secret_key': device.key,
                'next': request.session.get('2fa_pending_next', reverse('home')),
                'error': 'Invalid token. Please try again.',
            }
        )


@method_decorator(never_cache, name="dispatch")
class LoginView(View):    
    def get(self, request):
        next = request.GET.get("next", reverse("home"))
        registration_success = request.GET.get("registration_success")

        if request.GET.get("logout", None) is not None:
            logout(request)
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            return redirect("auth")
        
        if request.session.get('2fa_pending_user_id'):
            return render(
                request,
                "two_factor_token.htm",
                {
                    "next": request.session.get('2fa_pending_next', next),
                    "token_error": False,
                },
            )
        
        return render(
            request,
            "login.htm",
            {
                "auth_failed": False,
                "next": next,
                "registration_success": registration_success,
                "user_signup_enabled": settings.ENABLE_USER_SIGNUP,
            },
        )

    def post(self, request):
        next = request.POST.get("next", reverse("home"))
        
        otp_token = request.POST.get('otp_token', '').strip()
        if otp_token and request.session.get('2fa_pending_user_id'):
            logger.info("Processing OTP verification")
            return self._verify_otp(request, otp_token, next)
        
        username = request.POST.get("username", None)
        password = request.POST.get("password", None)
        
        logger.info(f"Attempting username/password authentication for user: {username}")
        
        if not username or not password:
            return render(
                request, 
                "login.htm", 
                {"auth_failed": True, "next": next, "user_signup_enabled": settings.ENABLE_USER_SIGNUP}, 
                status=401
            )
        
        user = authenticate(username=username, password=password)
        
        if user is not None and user.is_active:
            if user_has_device(user):
                request.session['2fa_pending_user_id'] = user.pk
                request.session['2fa_pending_next'] = next
                request.session['2fa_timestamp'] = time.time()
                
                return render(
                    request,
                    "two_factor_token.htm",
                    {
                        "next": next,
                        "token_error": False,
                    },
                )
            else:
                request.session['2fa_pending_user_id'] = user.pk
                request.session['2fa_pending_next'] = next
                request.session['2fa_timestamp'] = time.time()
                
                return redirect('two_factor_setup_pending')

        return render(
            request, 
            "login.htm", 
            {"auth_failed": True, "next": next, "user_signup_enabled": settings.ENABLE_USER_SIGNUP}, 
            status=401
        )
    
    def _verify_otp(self, request, otp_token, next_url):
        """Verify OTP token and complete login"""
        from django.contrib.auth import get_user_model
        
        user_id = request.session.get('2fa_pending_user_id')
        timestamp = request.session.get('2fa_timestamp', 0)
        
        if not user_id:
            return redirect('auth')

        timeout = getattr(settings, 'TWO_FACTOR_LOGIN_TIMEOUT', 600)
        if timeout and (time.time() - timestamp) > timeout:
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            return render(
                request,
                "login.htm",
                {
                    "auth_failed": True,
                    "timeout": True,
                    "next": next_url,
                    "user_signup_enabled": settings.ENABLE_USER_SIGNUP,
                },
                status=401
            )
        
        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            return redirect("auth")

        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        verified = device and device.verify_token(otp_token)
        
        if not verified:
            # Check backup codes
            static_device = StaticDevice.objects.filter(user=user).first()
            if static_device and static_device.verify_token(otp_token):
                verified = True

        if verified:
            request.session.pop('2fa_pending_user_id', None)
            request.session.pop('2fa_pending_next', None)
            request.session.pop('2fa_timestamp', None)
            
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            user.password = ""
            
            return redirect(next_url)

        return render(
            request,
            "two_factor_token.htm",
            {
                "next": next_url,
                "token_error": True,
            },
        )


def _person_decrypt(person):
    from arches_orm.models import Person

    if not person:
        raise (Exception(("User can only be signed up by linking to a pre-known Person.")))

    AES = AESCipher(settings.SECRET_KEY)
    try:
        person_str = AES.decrypt(person)
    except Exception:
        raise (Exception(("User can only be signed up by linking to a pre-known Person with encrypted ID.")))

    person_id, link_id = person_str.split(":")
    person = Person.find(person_id)

    if not person:
        raise (Exception(("User can only be signed up by linking to a pre-known resource.")))

    link = RegistrationLink.objects.get(pk=link_id)
    if not link:
        raise (Exception(("This link has been used or is no longer present.")))

    if link.used:
        raise (Exception(("This link has been used.")))

    if str(link.person_id) != str(person_id):
        raise (Exception(("This link does not match the requested person.")))

    return person, link

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
        with admin():
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
        with admin():
            person, link = _person_decrypt(person)
            del userinfo["person_enc"]

            form = CoralUserCreationForm(userinfo)

            if person.user_account:
                form.errors["ts"] = [("This sign-up link is no longer valid, please re-request a link.")]
            else:
                if datetime.fromtimestamp(userinfo["ts"]) + timedelta(days=1) >= datetime.fromtimestamp(int(time.time())):
                    if form.is_valid():
                        user = form.save()
                        person.user_account = user.pk
                        try:
                            person.save()
                        except django.db.utils.ProgrammingError:
                            form.errors["ts"] = [("This sign-up link is no longer valid, please re-request a link.")]
                        else:
                            for group in link.metadata["groups"]:
                                signup_group = Group.objects.get(name=group)
                                user.groups.add(signup_group)
                            link.used = datetime.now()
                            link.save()
                            return redirect(reverse("auth") + "?registration_success=true")
                    else:
                        try:
                            for error in form.errors.as_data()["username"]:
                                if error.code == "unique":
                                    return redirect("auth")
                        except:
                            pass
                else:
                    form.errors["ts"] = [("The signup link has expired, please try signing up again.  Thanks!")]

        return render(
            request,
            "signup.htm",
            {"form": form, "showform": True, "postdata": userinfo, "validation_help": validation.password_validators_help_texts()},
        )
