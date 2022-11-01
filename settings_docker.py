from arches.settings_local import *

ALLOWED_HOSTS = ['localhost', '*'] # get_env_variable("DOMAIN_NAMES").split()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"console": {"format": "%(asctime)s %(name)-12s %(levelname)-8s %(message)s",},},
    "handlers": {
        "console": {"level": "WARNING", "class": "logging.StreamHandler", "formatter": "console"},
    },
    "loggers": {"arches": {"handlers": ["console"], "level": "WARNING", "propagate": True}},
}

CELERY_BROKER_URL = get_env_variable("CELERY_BROKER_URL")
MOBILE_OAUTH_CLIENT_ID = get_optional_env_variable("MOBILE_OAUTH_CLIENT_ID")
STATIC_URL = get_optional_env_variable("STATIC_URL") or "/media/"
COMPRESS_OFFLINE = get_optional_env_variable("COMPRESS_OFFLINE")
COMPRESS_OFFLINE = COMPRESS_OFFLINE and COMPRESS_OFFLINE.lower() == "true"
COMPRESS_ENABLED = True
