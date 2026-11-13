"""Refuse to run the Cypress seed commands outside a throwaway environment."""

import os

from django.core.management.base import CommandError

ENV_VAR = "CORAL_ALLOW_TEST_SEED"


def require_test_environment(command_name):
    """Abort unless this environment has opted in to destructive test seeding.

    The seed commands create accounts with a shared, published password and attach a
    published TOTP key to admin, so on a real deployment they hand out working logins and
    defeat forced 2FA. A docstring saying "test environments only" does not stop
    `manage.py <cmd>` on a prod shell; this does.
    """
    if os.environ.get(ENV_VAR) != "1":
        raise CommandError(
            f"{command_name} seeds published test credentials and will not run unless "
            f"{ENV_VAR}=1 is set. Set it only on a database you can throw away."
        )
