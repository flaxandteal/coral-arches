import hashlib
import hmac
import time

from django.conf import settings


class GateCookieMiddleware:
    """Set an HMAC-signed cookie for gateway-level auth checks.

    The gateway ext-authz service verifies this cookie to allow/deny
    requests to /search and /api/ without contacting Django. This
    protects those endpoints even when the backend is unavailable.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self._secret = getattr(settings, "GATEWAY_GATE_SECRET", "").encode()

    def __call__(self, request):
        response = self.get_response(request)

        if not self._secret:
            return response

        if getattr(request, "user", None) and request.user.is_authenticated:
            ts = str(int(time.time()))
            sig = hmac.new(self._secret, ts.encode(), hashlib.sha256).hexdigest()
            response.set_cookie(
                "coral_gate",
                f"{ts}.{sig}",
                max_age=settings.SESSION_COOKIE_AGE,
                secure=settings.SESSION_COOKIE_SECURE,
                httponly=True,
                samesite=settings.SESSION_COOKIE_SAMESITE,
                path="/",
            )
        elif not hasattr(request, "user") or not request.user.is_authenticated:
            if "coral_gate" in request.COOKIES:
                response.delete_cookie("coral_gate", path="/")

        return response
