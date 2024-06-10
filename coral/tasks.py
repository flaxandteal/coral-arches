import yaml
import logging
import datetime
from pathlib import Path
from celery import shared_task
from tempfile import NamedTemporaryFile

from arches.app.models.system_settings import settings
from arches.app.utils.arches_crypto import AESCipher

from coral.permissions.casbin import CasbinPermissionFramework
from coral.management.commands.packages import Command as PackageCommand

logging.basicConfig()

@shared_task
def recalculate_permissions_table():
    framework = CasbinPermissionFramework()
    enforcer = framework._enforcer
    framework.recalculate_table()
    enforcer.model.print_policy()

@shared_task
def reset_database(lock_code_enc):
    lock_code = AES.decrypt(lock_code_enc)

    if not hasattr(settings, "CORAL_UPGRADE_WINDOW_FILE"):
        logging.error(
            "No upgrade windows file set (CORAL_UPGRADE_WINDOW_FILE), so cannot programmatically reset DB"
        )
        return

    with Path(settings.CORAL_UPGRADE_WINDOW_FILE).open() as uwf:
        upgrade_windows = yaml.load(uwf)

    in_window = False
    now = datetime.datetime.now()
    AES = AESCipher(settings.SECRET_KEY)
    for fm, to, window_code_enc in upgrade_windows:
        fm = datetime.datetime.fromisoformat(fm)
        to = datetime.datetime.fromisoformat(to)
        if fm <= now <= to:
            unlock = False
            try:
                unlock = AES.decrypt(window_code_enc) == lock_code
            except Exception as exc:
                logging.error("%s: Could not decrypt window lock for %s:%s", str(exc), fm, to)
            if unlock:
                in_window = True
                break
            else:
                logging.error("Could not match window lock after %s", fm)
                return

    if in_window:
        command = PackageCommand()
        with NamedTemporaryFile() as tf:
            # This is a workaround for the fact that we cannot pass a flag to
            # prevent writing SYSTEM_SETTINGS_LOCAL_PATH
            sslp = settings.SYSTEM_SETTINGS_LOCAL_PATH
            settings.SYSTEM_SETTINGS_LOCAL_PATH = tf.name
            command.load_package(
                str(Path(__file__).parent / "pkg"),
                setup_db=True,
                defer_indexing=False,
                is_application=False,
                include_business_data=True
            )
            settings.SYSTEM_SETTINGS_LOCAL_PATH = sslp
        logging.info(
            "Completed automated reset"
        )
    else:
        logging.error(
            "Not currently in an upgrade window, check %s",
            settings.CORAL_UPGRADE_WINDOW_FILE
        )
        return
