"""
Django settings for coral project.
"""

try:
    import tomllib
except ImportError:
    from pip._vendor import tomli as tomllib

import json
import os
import sys
import arches
import inspect
import semantic_version
from pathlib import Path
from django.utils.translation import gettext_lazy as _
from datetime import datetime, timedelta
from csp.constants import SELF, NONE
from csp.constants import SELF, NONE, NONCE

try:
    from arches.settings import *
except ImportError:
    pass

try:
    from arches.settings_utils import transmit_webpack_django_config
except ImportError:
    import importlib
    import site

    def transmit_webpack_django_config(
        root_dir, app_root, static_url, public_server_address,
        webpack_development_server_port, arches_applications=None,
    ):
        arches_applications_paths = {}
        if arches_applications:
            for app in arches_applications:
                importlib.import_module(app)
                arches_applications_paths[app] = os.path.split(
                    sys.modules[app].__spec__.origin
                )[0]
        sys.stdout.write(json.dumps({
            "APP_ROOT": os.path.realpath(app_root),
            "ARCHES_APPLICATIONS": list(arches_applications) if arches_applications else [],
            "ARCHES_APPLICATIONS_PATHS": arches_applications_paths,
            "SITE_PACKAGES_DIRECTORY": site.getsitepackages()[0],
            "PUBLIC_SERVER_ADDRESS": public_server_address,
            "ROOT_DIR": os.path.realpath(root_dir),
            "STATIC_URL": static_url,
            "WEBPACK_DEVELOPMENT_SERVER_PORT": webpack_development_server_port,
        }))
        sys.stdout.flush()

try:
    from arches.settings_utils import build_staticfiles_dirs
except ImportError:
    def build_staticfiles_dirs(*, app_root=None, additional_directories=None):
        directories = []
        if additional_directories:
            for additional_directory in additional_directories:
                directories.append(additional_directory)
        if app_root:
            directories.append(os.path.join(app_root, "media", "build"))
            directories.append(os.path.join(app_root, "media"))
            directories.append((
                "node_modules",
                os.path.normpath(os.path.join(app_root, "..", "node_modules")),
            ))
        return tuple(directories)

try:
    from arches.settings_utils import build_templates_config
except ImportError:
    def build_templates_config(
        *, debug, app_root=None, additional_directories=None, context_processors=None,
    ):
        directories = []
        if additional_directories:
            for additional_directory in additional_directories:
                directories.append(additional_directory)
        if app_root:
            directories.append(os.path.join(app_root, "templates"))
        return [
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "DIRS": directories,
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": (
                        context_processors
                        if context_processors
                        else [
                            "django.contrib.auth.context_processors.auth",
                            "django.template.context_processors.debug",
                            "django.template.context_processors.i18n",
                            "django.template.context_processors.media",
                            "django.template.context_processors.static",
                            "django.template.context_processors.tz",
                            "django.template.context_processors.request",
                            "django.contrib.messages.context_processors.messages",
                            "arches.app.utils.context_processors.livereload",
                            "arches.app.utils.context_processors.map_info",
                            "arches.app.utils.context_processors.app_settings",
                        ]
                    ),
                    "debug": debug,
                },
            },
        ]

APP_NAME = 'coral'

# Version comes from pyproject.toml, and is bumped only at release by ./release.
# CI writes coral/BUILD on non-main builds only, so dev shows v8.1.0+dev.ab12cd34
# (same version line, built from that commit) while prod shows a clean v8.1.0.
_pyproject = Path(__file__).resolve().parent.parent / "pyproject.toml"
if _pyproject.exists():
    _version = tomllib.loads(_pyproject.read_text())["project"]["version"]
else:
    from importlib.metadata import version as _dist_version

    _version = _dist_version("coral-arches")

_build = Path(__file__).resolve().parent / "BUILD"
APP_VERSION = semantic_version.Version(
    f"{_version}+{_build.read_text().strip()}" if _build.exists() else _version
)

TIME_ZONE = "Europe/London"
USE_TZ = True

GROUPINGS = {
    "groups": {
        "allowed_relationships": {
            "http://www.cidoc-crm.org/cidoc-crm/P107_has_current_or_former_member": (True, True),
        },
        "root_group": "d2368123-9628-49a2-b3dd-78ac6ee3e911",
        "graph_id": "07883c9e-b25c-11e9-975a-a4d18cec433a"
    },
    "permissions": {
        "allowed_relationships": {
            "http://www.cidoc-crm.org/cidoc-crm/P107_has_current_or_former_member": (True, False),
            "http://www.cidoc-crm.org/cidoc-crm/P104i_applies_to": (True, True),
            "http://www.cidoc-crm.org/cidoc-crm/P10i_contains": (True, True),
        },
        "root_group": "74e496c7-ec7e-43b8-a7b3-05bacf496794",
    }
}

APP_ROOT = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

WEBPACK_LOADER = {
    "DEFAULT": {
        "STATS_FILE": os.path.join(APP_ROOT, "..", "webpack/webpack-stats.json"),
    },
}

CASBIN_MODEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'permissions', 'casbin.conf')
CASBIN_RELOAD_QUEUE = os.getenv("CASBIN_RELOAD_QUEUE", "reloadQueue")

CORAL_UPGRADE_WINDOW_FILE = os.getenv("CORAL_UPGRADE_WINDOW_FILE", "")

DAUTHZ = {
    # DEFAULT Dauthz enforcer
    "DEFAULT": {
        # Casbin model setting.
        "MODEL": {
            # Available Settings: "file", "text"
            "CONFIG_TYPE": "file",
            "CONFIG_FILE_PATH": CASBIN_MODEL,
            "CONFIG_TEXT": "",
        },
        # Casbin adapter .
        "ADAPTER": {
            "NAME": "casbin_adapter.adapter.Adapter",
            # 'OPTION_1': '',
        },
        "LOG": {
            # Changes whether Dauthz will log messages to the Logger.
            "ENABLED": False,
        },
    },
}
DATATYPE_LOCATIONS.append('coral.datatypes')
FUNCTION_LOCATIONS.append('coral.functions')
ETL_MODULE_LOCATIONS = list(globals().get('ETL_MODULE_LOCATIONS', []))
ETL_MODULE_LOCATIONS.append('coral.etl_modules')
SEARCH_COMPONENT_LOCATIONS.append('coral.search_components')
PERMISSION_LOCATIONS = list(globals().get('PERMISSION_LOCATIONS', []))
PERMISSION_LOCATIONS.append('coral.permissions')
TEMPLATES[0]['DIRS'].append(os.path.join(APP_ROOT, 'functions', 'templates'))
TEMPLATES[0]['DIRS'].append(os.path.join(APP_ROOT, 'widgets', 'templates'))
TEMPLATES[0]['DIRS'].insert(0, os.path.join(APP_ROOT, 'templates'))

ANONYMOUS_SETS = []

try:
    with (Path(__file__).parent / "wkrm.toml").open("rb") as wkrm_f:
        WELL_KNOWN_RESOURCE_MODELS = [model for _, model in tomllib.load(wkrm_f).items()]
except:
    with (Path(__file__).parent / "wkrm.toml").open("r") as wkrm_f:
        WELL_KNOWN_RESOURCE_MODELS = [model for _, model in tomllib.load(wkrm_f).items()]

LOCALE_PATHS.append(os.path.join(APP_ROOT, 'locale'))

FILE_TYPE_CHECKING = None
FILE_TYPES = ["bmp", "gif", "jpg", "jpeg", "pdf", "png", "psd", "rtf", "tif", "tiff", "xlsx", "csv", "zip"]
FILENAME_GENERATOR = "arches.app.utils.storage_filename_generator.generate_filename"
UPLOADED_FILES_DIR = os.environ.get("UPLOADED_FILES_DIR", "")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '!^1-(*%x1ww9-_qp5qg(+d((3dj!m!w5v^qm#lfkjf*^73_8tf'

# SECURITY WARNING: don't run with debug turned on in production!
###
# 
# This has been commented since we want DEBUG false to stop the debug middleware
# but also to allow DJANGO_DEBUG to override Nginx and allow CSS/JS to be sourced
# in the browser. :)
#
# DEBUG = os.getenv("DEBUG", (os.getenv("DJANGO_DEBUG", False) == 'True'))
DEBUG = False

ROOT_URLCONF = 'coral.urls'
ROOT_HOSTCONF = 'coral.hosts'
DEFAULT_HOST = 'coral'

# Modify this line as needed for your project to connect to elasticsearch with a password that you generate
ES_TIMEOUT = int(os.getenv("ES_TIMEOUT", "60"))
ELASTICSEARCH_CONNECTION_OPTIONS = {"request_timeout": ES_TIMEOUT, "verify_certs": False, "basic_auth": ("elastic", "E1asticSearchforArche5")}
ELASTICSEARCH_HOSTS = [{"scheme": "http", "host": os.environ.get("ESHOST", "localhost"), "port": int(os.environ.get("ESPORT", 9200))}]

# If you need to connect to Elasticsearch via an API key instead of username/password, use the syntax below:
# ELASTICSEARCH_CONNECTION_OPTIONS = {"timeout": 30, "verify_certs": False, "api_key": "<ENCODED_API_KEY>"}
# ELASTICSEARCH_CONNECTION_OPTIONS = {"timeout": 30, "verify_certs": False, "api_key": ("<ID>", "<API_KEY>")}

# Your Elasticsearch instance needs to be configured with xpack.security.enabled=true to use API keys - update elasticsearch.yml or .env file and restart.

# Set the ELASTIC_PASSWORD environment variable in either the docker-compose.yml or .env file to the password you set for the elastic user,
# otherwise a random password will be generated.

# API keys can be generated via the Elasticsearch API: https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-api-key.html
# Or Kibana: https://www.elastic.co/guide/en/kibana/current/api-keys.html

# a prefix to append to all elasticsearch indexes, note: must be lower case
ELASTICSEARCH_PREFIX = 'coral'

REFERENCES_INDEX_NAME = "references"
ELASTICSEARCH_CUSTOM_INDEXES = [
    {
        "module": "arches_controlled_lists.search_indexes.reference_index.ReferenceIndex",
        "name": REFERENCES_INDEX_NAME,
        "should_update_asynchronously": True,
    },
]
TERM_SEARCH_TYPES = [
    {
        "type": "term",
        "label": _("Term Matches"),
        "key": "terms",
        "module": "arches.app.search.search_term.TermSearch",
    },
    {
        "type": "concept",
        "label": _("Concepts"),
        "key": "concepts",
        "module": "arches.app.search.concept_search.ConceptSearch",
    },
    {
        "type": "reference",
        "label": _("References"),
        "key": REFERENCES_INDEX_NAME,
        "module": "arches_controlled_lists.search_indexes.reference_index.ReferenceIndex",
    },
]
ES_MAPPING_MODIFIER_CLASSES = [
    "arches_controlled_lists.search.references_es_mapping_modifier.ReferencesEsMappingModifier"
]

KIBANA_URL = "http://localhost:5601/"
KIBANA_CONFIG_BASEPATH = "kibana"  # must match Kibana config.yml setting (server.basePath) but without the leading slash,
# also make sure to set server.rewriteBasePath: true

LOAD_DEFAULT_ONTOLOGY = False
LOAD_PACKAGE_ONTOLOGIES = True

# This is the namespace to use for export of data (for RDF/XML for example)
# It must point to the url where you host your site
# Make sure to use a trailing slash
ARCHES_NAMESPACE_FOR_DATA_EXPORT = "http://localhost:8000/"

DATABASES = {
    "default": {
        "ATOMIC_REQUESTS": False,
        "AUTOCOMMIT": True,
        "CONN_MAX_AGE": 0,
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "HOST": "localhost",
        "NAME": "arches2",
        "OPTIONS": {
            "options": "-c cursor_tuple_fraction=1",
        },
        "PASSWORD": "postgres",
        "PORT": "5432",
        "POSTGIS_TEMPLATE": "template_postgis",
        "TEST": {
            "CHARSET": None,
            "COLLATION": None,
            "MIRROR": None,
            "NAME": None
        },
        "TIME_ZONE": None,
        "USER": "postgres"
    }
}

SEARCH_THUMBNAILS = False

SAVED_SEARCHES = []

INSTALLED_APPS = (
    "csp",
    "webpack_loader",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django.contrib.postgres",
    "django_hosts",
    "arches_controlled_lists",
    "arches_querysets",
    "arches_vue_components",
    "arches_modular_reports",
    "arches_search",
    "arches_json_importer",
    "arches",
    "arches.app.models",
    "arches.management",
    "guardian",
    "django_recaptcha",
    "revproxy",
    "corsheaders",
    "oauth2_provider",
    "django_celery_results",
    "django_migrate_sql",
    "pgtrigger",
    "dauthz.apps.DauthzConfig",
    "django_otp",
    "django_otp.plugins.otp_static",
    "django_otp.plugins.otp_totp",
    "two_factor",
    # "silk",
    "coral",
    "querysets_shim.apps.QuerysetsShimConfig",
)

# Placing this last ensures any templates provided by Arches Applications
# take precedence over core arches templates in arches/app/templates.
INSTALLED_APPS += (
    "arches.app",
    "django.contrib.admin",
)

if DEBUG:
    INSTALLED_APPS = (*INSTALLED_APPS, "debug_toolbar",)

ARCHES_APPLICATIONS = ("arches_modular_reports", "arches_search", "arches_json_importer",)

MIDDLEWARE = [
    "django_hosts.middleware.HostsRequestMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "csp.middleware.CSPMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    #'arches.app.utils.middleware.TokenMiddleware',
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "arches.app.utils.middleware.ModifyAuthorizationHeader",
    "oauth2_provider.middleware.OAuth2TokenMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "arches.app.utils.middleware.SetAnonymousUser",
    "coral.middleware.GateCookieMiddleware",
    "django_otp.middleware.OTPMiddleware",
    # "coral.middleware.TwoFactorAuthMiddleware",  # DISABLED - 2FA now integrated into LoginView
    # "silk.middleware.SilkyMiddleware",
    "querysets_shim.middleware.QuerysetsShimContextMiddleware",
    "django_hosts.middleware.HostsResponseMiddleware",
]

CORS_ALLOWED_ORIGINS = [
    "https://crl-data-store-uat-eu-west-2-prd.storage.googleapis.com"
]

CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": [NONE],
        "script-src": [SELF, "'unsafe-inline'", "'unsafe-eval'", "cdnjs.cloudflare.com", "api.mapbox.com", "events.mapbox.com", "mo.ev.openindustry.in", "storage.googleapis.com"],
        "img-src": [SELF, "blob:", "data:", "mo.ev.openindustry.in"],
        "font-src": [SELF, "blob:", "cdnjs.cloudflare.com", "fonts.gstatic.com", "fonts.googleapis.com"],
        "style-src": [SELF, "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com", "api.mapbox.com"],
        "connect-src": [SELF, "cdnjs.cloudflare.com", "api.mapbox.com", "events.mapbox.com", "mo.ev.openindustry.in", "storage.googleapis.com"],
        "worker-src": [SELF, "blob:"],
    },
}

X_FRAME_OPTIONS = 'DENY'

MAPBOX_API_KEY = os.environ.get("MAPBOX_API_KEY", MAPBOX_API_KEY)

USE_LOCAL_STORAGE = os.environ.get("USE_LOCAL_STORAGE", "False").lower() == "true"

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

if DEBUG:
    MIDDLEWARE.append("debug_toolbar.middleware.DebugToolbarMiddleware")
    MIDDLEWARE.append("debug_toolbar_force.middleware.ForceDebugToolbarMiddleware")
    import socket
    hostname, __, ips = socket.gethostbyname_ex(socket.gethostname())
    INTERNAL_IPS = [ip[: ip.rfind(".")] + ".1" for ip in ips] + ["127.0.0.1", "10.0.2.2"]

AWS_STORAGE_BUCKET_NAME=os.environ.get("AWS_STORAGE_BUCKET_NAME", None)
AWS_S3_ENDPOINT_URL=os.environ.get("AWS_S3_ENDPOINT_URL", None)
AWS_SECRET_ACCESS_KEY=os.environ.get("AWS_SECRET_ACCESS_KEY", None)
AWS_ACCESS_KEY_ID=os.environ.get("AWS_ACCESS_KEY_ID", None)

if AWS_STORAGE_BUCKET_NAME and AWS_S3_ENDPOINT_URL and AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID:
    INSTALLED_APPS = (*INSTALLED_APPS, "storages",)
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
            "OPTIONS": {},
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'
        }
    }

STATICFILES_DIRS = build_staticfiles_dirs(
    app_root=APP_ROOT,
)

SERVE_STATIC = os.getenv("SERVE_STATIC", "True") == "True"

TEMPLATES = build_templates_config(
    debug=DEBUG,
    app_root=APP_ROOT,
)

ALLOWED_HOSTS = []

SYSTEM_SETTINGS_LOCAL_PATH = os.path.join(APP_ROOT, 'system_settings', 'System_Settings.json')
WSGI_APPLICATION = 'coral.wsgi.application'

# URL that handles the media served from MEDIA_ROOT, used for managing stored files.
# It must end in a slash if set to a non-empty value.
MEDIA_URL = '/files/'

# Absolute filesystem path to the directory that will hold user-uploaded files.
MEDIA_ROOT =  os.path.join(APP_ROOT)

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = os.path.join(APP_ROOT, "staticfiles")

# when hosting Arches under a sub path set this value to the sub path eg : "/{sub_path}/"
FORCE_SCRIPT_NAME = None

FORCE_USER_SIGNUP_EMAIL_AUTHENTICATION = False
RESOURCE_IMPORT_LOG = os.path.join(APP_ROOT, 'logs', 'resource_import.log')
DEFAULT_RESOURCE_IMPORT_USER = {'username': 'admin', 'userid': 1}

USER_SIGNUP_GROUP = "Crowdsource Editor"
ALLOWED_SIGNUP_GROUPS = [
    "Crowdsource Editor",
    "Resource Editor",
    "Resource Reviewer",
]

USE_CASBIN = os.getenv("USE_CASBIN", "true").lower() == "true"
if USE_CASBIN:
    AUTHENTICATION_BACKENDS = (
        *AUTHENTICATION_BACKENDS,
        "dauthz.backends.CasbinBackend",
    )
    PERMISSION_FRAMEWORK = "casbin.CasbinPermissionFramework"
    INSTALLED_APPS = (
        *INSTALLED_APPS,
        "casbin_adapter.apps.CasbinAdapterConfig"
    )
else:
    PERMISSION_FRAMEWORK = "arches_allow_with_credentials.ArchesAllowWithCredentialsFramework"

if (LOG_LEVEL := os.getenv("LOG_LEVEL", "")):
    pass
elif DEBUG or {os.getenv(debug_env, "False").lower() for debug_env in ("DJANGO_DEBUG", "DEBUG")} & {"true", "1"}:
    LOG_LEVEL = "DEBUG"
else:
    LOG_LEVEL = "WARNING"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'console': {
            'format': '%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
        },
    },
    'handlers': {
        'file': {
            'level': 'WARNING',  # DEBUG, INFO, WARNING, ERROR
            'class': 'logging.FileHandler',
            'filename': os.path.join(APP_ROOT, 'arches.log'),
            'formatter': 'console'
        },
        'console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'console'
        }
    },
    'loggers': {
        'arches': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': True
        },
        'django.request': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': True
        },
    }
}

# Rate limit for authentication views
# See options (including None or python callables):
# https://django-ratelimit.readthedocs.io/en/stable/rates.html#rates-chapter
RATE_LIMIT = "5/m"

# Sets default max upload size to 15MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 15728640

GATEWAY_GATE_SECRET = os.environ.get("GATEWAY_GATE_SECRET", "")

# Unique session cookie ensures that logins are treated separately for each app
SESSION_COOKIE_NAME = 'coral'

# Session expires after 8 hours instead of Django's 2-week default
SESSION_COOKIE_AGE = 60 * 60 * 8  # 8 hours

# Additional cookie security params
# DJANGO_INSECURE_COOKIES=True disables Secure flag for local HTTP dev.
# Browsers refuse to transmit Secure cookies over plain HTTP, which manifests as
# "CSRF token from the 'X-Csrftoken' HTTP header has incorrect length" because the
# JS reads a stale/empty csrftoken cookie.
_INSECURE_COOKIES = os.getenv("DJANGO_INSECURE_COOKIES", "False").lower() in ("true", "1")
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Strict"
CSRF_COOKIE_SECURE = not _INSECURE_COOKIES
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Strict"
SESSION_COOKIE_SECURE = not _INSECURE_COOKIES

LOGIN_URL = 'auth'
LOGIN_REDIRECT_URL = 'two_factor:profile'
TWO_FACTOR_PATCH_ADMIN = True
TWO_FACTOR_TOTP_DIGITS = 6
TWO_FACTOR_LOGIN_TIMEOUT = 600  # seconds
TWO_FACTOR_LOGIN_URL = 'two_factor:login'

ENABLE_TWO_FACTOR_AUTHENTICATION = False
FORCE_TWO_FACTOR_AUTHENTICATION = False

# For more info on configuring your cache: https://docs.djangoproject.com/en/2.2/topics/cache/
CACHES = {
    'default': {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake"
    },
    'user_permission': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'user_permission_cache',
    },
    'dashboard_versioning': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'dashboard_version_cache',
    }
}

# -- arches_search patches ----------------------------

CORAL_PRUNE_EMPTY_REPORT_SECTIONS = True

CORAL_INDEX_DESCRIPTORS = True

CORAL_DESCRIPTOR_RELEVANCE_SORT = os.environ.get("CORAL_DESCRIPTOR_RELEVANCE_SORT", "True").lower() != "false"

# Hide nodes and cards in a report that have no data
HIDE_EMPTY_NODES_IN_REPORT = True

BYPASS_UNIQUE_CONSTRAINT_TILE_VALIDATION = False
BYPASS_REQUIRED_VALUE_TILE_VALIDATION = False

DATE_IMPORT_EXPORT_FORMAT = "%Y-%m-%d" # Custom date format for dates imported from and exported to csv

# This is used to indicate whether the data in the CSV and SHP exports should be
# ordered as seen in the resource cards or not.
EXPORT_DATA_FIELDS_IN_CARD_ORDER = False

#Identify the usernames and duration (seconds) for which you want to cache the time wheel
CACHE_BY_USER = {
    "default": 3600 * 24, #24hrs
    "anonymous": 3600 * 24 #24hrs
    }

TILE_CACHE_TIMEOUT = 600 #seconds
CLUSTER_DISTANCE_MAX = 5000 #meters
GRAPH_MODEL_CACHE_TIMEOUT = None

OAUTH_CLIENT_ID = ''  #'9JCibwrWQ4hwuGn5fu2u1oRZSs9V6gK8Vu8hpRC4'

APP_TITLE = 'HED | Heritage Data Management'
COPYRIGHT_TEXT = 'All Rights Reserved.'
COPYRIGHT_YEAR = '2022-'

ENABLE_CAPTCHA = False
# RECAPTCHA_PUBLIC_KEY = ''
# RECAPTCHA_PRIVATE_KEY = ''
# RECAPTCHA_USE_SSL = False
NOCAPTCHA = True
# RECAPTCHA_PROXY = 'http://127.0.0.1:8000'
if DEBUG is True:
    SILENCED_SYSTEM_CHECKS = ["django_recaptcha.recaptcha_test_key_error"]


EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", 'django.core.mail.backends.console.EmailBackend')
EMAIL_USE_TLS = str(os.getenv("EMAIL_USE_TLS", "1")).lower() in ("1", "true")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "xxxx@xxx.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "xxxxxxx")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))

DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

# If True, allows for user self creation via the signup view. If False, users can only be created via the Django admin view.
ENABLE_USER_SIGNUP = False
ENABLE_PERSON_USER_SIGNUP = True

CELERY_BROKER_URL = "" # RabbitMQ --> "amqp://guest:guest@localhost",  Redis --> "redis://localhost:6379/0"
CELERY_ACCEPT_CONTENT = ['json']
CELERY_RESULT_BACKEND = 'django-db' # Use 'django-cache' if you want to use your cache as your backend
CELERY_TASK_SERIALIZER = 'json'
RABBITMQ_USER = os.getenv("RABBITMQ_USER")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST")


CELERY_SEARCH_EXPORT_EXPIRES = 24 * 3600  # seconds
CELERY_SEARCH_EXPORT_CHECK = 3600  # seconds

CELERY_BEAT_SCHEDULE = {
    "delete-expired-search-export": {"task": "arches.app.tasks.delete_file", "schedule": CELERY_SEARCH_EXPORT_CHECK,},
    "notification": {"task": "arches.app.tasks.message", "schedule": CELERY_SEARCH_EXPORT_CHECK, "args": ("Celery Beat is Running",),},
}

# Set to True if you want to send celery tasks to the broker without being able to detect celery.
# This might be necessary if the worker pool is regulary fully active, with no idle workers, or if
# you need to run the celery task using solo pool (e.g. on Windows). You may need to provide another
# way of monitoring celery so you can detect the background task not being available.
CELERY_CHECK_ONLY_INSPECT_BROKER = True

CANTALOUPE_DIR = os.path.join(ROOT_DIR, UPLOADED_FILES_DIR)
CANTALOUPE_HTTP_ENDPOINT = "http://localhost:8182/"

ACCESSIBILITY_MODE = False

RENDERERS = [
    {
        "name": "imagereader",
        "title": "Image Reader",
        "description": "Displays most image file types",
        "id": "5e05aa2e-5db0-4922-8938-b4d2b7919733",
        "iconclass": "fa fa-camera",
        "component": "views/components/cards/file-renderers/imagereader",
        "ext": "",
        "type": "image/*",
        "exclude": "tif,tiff,psd",
    },
    {
        "name": "pdfreader",
        "title": "PDF Reader",
        "description": "Displays pdf files",
        "id": "09dec059-1ee8-4fbd-85dd-c0ab0428aa94",
        "iconclass": "fa fa-file",
        "component": "views/components/cards/file-renderers/pdfreader",
        "ext": "pdf",
        "type": "application/pdf",
        "exclude": "tif,tiff,psd",
    },
]

# By setting RESTRICT_MEDIA_ACCESS to True, media file requests outside of Arches will checked against nodegroup permissions.
RESTRICT_MEDIA_ACCESS = False

# By setting RESTRICT_CELERY_EXPORT_FOR_ANONYMOUS_USER to True, if the user is attempting
# to export search results above the SEARCH_EXPORT_IMMEDIATE_DOWNLOAD_THRESHOLD
# value and is not signed in with a user account then the request will not be allowed.
RESTRICT_CELERY_EXPORT_FOR_ANONYMOUS_USER = False

# Dictionary containing any additional context items for customising email templates
EXTRA_EMAIL_CONTEXT = {
    "salutation": _("Hi"),
    "expiration":(datetime.now() + timedelta(seconds=CELERY_SEARCH_EXPORT_EXPIRES)).strftime("%A, %d %B %Y")
}

# see https://docs.djangoproject.com/en/1.9/topics/i18n/translation/#how-django-discovers-language-preference
# to see how LocaleMiddleware tries to determine the user's language preference
# (make sure to check your accept headers as they will override the LANGUAGE_CODE setting!)
# also see get_language_from_request in django.utils.translation.trans_real.py
# to see how the language code is derived in the actual code

####### TO GENERATE .PO FILES DO THE FOLLOWING ########
# run the following commands
# language codes used in the command should be in the form (which is slightly different
# form the form used in the LANGUAGE_CODE and LANGUAGES settings below):
# --local={countrycode}_{REGIONCODE} <-- countrycode is lowercase, regioncode is uppercase, also notice the underscore instead of hyphen
# commands to run (to generate files for "British English, German, and Spanish"):
# django-admin.py makemessages --ignore=env/* --local=de --local=en --local=en_GB --local=es  --extension=htm,py
# django-admin.py compilemessages


# default language of the application
# language code needs to be all lower case with the form:
# {langcode}-{regioncode} eg: en, en-gb ....
# a list of language codes can be found here http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = "en"

# list of languages to display in the language switcher,
# if left empty or with a single entry then the switch won't be displayed
# language codes need to be all lower case with the form:
# {langcode}-{regioncode} eg: en, en-gb ....
# a list of language codes can be found here http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGES = [
#   ('de', _('German')),
    ('en', _('English')),
#   ('en-gb', _('British English')),
#   ('es', _('Spanish')),
]

# override this to permenantly display/hide the language switcher
SHOW_LANGUAGE_SWITCH = len(LANGUAGES) > 1

try:
    from .package_settings import *
except ImportError:
    try:
        from package_settings import *
    except ImportError as e:
        pass

try:
    from .settings_local import *
except ImportError as e:
    try:
        from settings_local import *
    except ImportError as e:
        pass

# returns an output that can be read by NODEJS
if __name__ == "__main__":
    transmit_webpack_django_config(
        root_dir=ROOT_DIR,
        app_root=APP_ROOT,
        arches_applications=ARCHES_APPLICATIONS,
        public_server_address=PUBLIC_SERVER_ADDRESS,
        static_url=STATIC_URL,
        webpack_development_server_port=WEBPACK_DEVELOPMENT_SERVER_PORT,
    )
