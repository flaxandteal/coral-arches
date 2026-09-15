from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django_otp.plugins.otp_totp.models import TOTPDevice

TEST_KEY = "3132333435363738393031323334353637383930"


class Command(BaseCommand):
    help = (
        "Seed a confirmed TOTP device on a user (default: admin) using the RFC 6238 "
        "test key so the Cypress E2E suite can complete coral's forced-2FA login. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default="admin",
            help="Username to attach the confirmed test TOTP device to (default: admin).",
        )

    def handle(self, *args, **options):
        username = options["username"]
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist")

        device, created = TOTPDevice.objects.update_or_create(
            user=user,
            name="cypress",
            defaults=dict(
                key=TEST_KEY,
                step=30,
                t0=0,
                digits=6,
                tolerance=2,
                confirmed=True,
            ),
        )

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} confirmed test TOTP device '{device.name}' for user '{user.username}'"
            )
        )
