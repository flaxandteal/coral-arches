"""
Django settings for coral project.
"""

import json
import os
import sys
import arches
import inspect
from datetime import datetime, date
import json
from django.utils.translation import gettext_lazy as _

try:
    from arches.settings import *
except ImportError:
    pass

class Semantic:
    pass

class Concept:
    pass

class GeoJSON:
    pass

APP_NAME = 'coral'
APP_ROOT = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
APP_PATHNAME = os.getenv("APP_PATHNAME", "")
STATICFILES_DIRS =  (
    os.path.join(APP_ROOT, 'media', 'build'),
    os.path.join(APP_ROOT, 'media'),
) + STATICFILES_DIRS

WELL_KNOWN_MAPPING_FILE = os.getenv("WELL_KNOWN_MAPPING_FILE", None)
WELL_KNOWN_RESOURCE_MODELS = [
    dict(
        model_name="Monument",
        __str__=lambda ri: ri.monument_name,
        graphid="076f9381-7b00-11e9-8d6b-80000b44d1d9",
        monument_name={
            "type": str,
            "lang": "en",
            "nodegroupid": "676d47f9-9c1c-11ea-9aa0-f875a44e0e11",
            "nodeid": "676d47ff-9c1c-11ea-b07f-f875a44e0e11",
        },
    )
]
if WELL_KNOWN_MAPPING_FILE:
    with open(WELL_KNOWN_MAPPING_FILE, "r") as wkfd:
        wkrm: dict = {wkrm["model_name"]: wkrm for wkrm in WELL_KNOWN_RESOURCE_MODELS}
        for name, model in json.load(wkfd).items():
            semantic_fields = {}
            for fieldname, field in model.items():
                if fieldname in ("__str__", "model_name", "graphid"):
                    continue
                if "__str__" in field:
                    strattr = field["__str__"]
                    field["__str__"] = lambda ri: getattr(ri, strattr)
                if "type" in field:
                    if field["type"] == "str":
                        field["type"] = str
                    elif field["type"] == "[str]":
                        field["type"] = [str]
                    elif field["type"] == "int":
                        field["type"] = int
                    elif field["type"] == "date":
                        field["type"] = date
                    elif field["type"] == "edtf":
                        field["type"] = "edtf" # use datatype properly
                    elif field["type"] == "geojson":
                        field["type"] = GeoJSON
                    elif field["type"] == "datetime":
                        field["type"] = datetime
                    elif field["type"] == "concept":
                        field["type"] = Concept
                    elif field["type"] == "[concept]":
                        field["type"] = [Concept]
                    elif field["type"] == "float":
                        field["type"] = float
                    elif field["type"] == "bool":
                        field["type"] = "boolean"
                    else:
                        # relationship
                        field["type"] = f"@{field['type']}"
                if "/" in fieldname:
                    fieldname, __ = fieldname.split("/", -1)
                    if "/" in fieldname:
                        raise NotImplementedError("Cannot currently support nested semantic fields in well-known resource models")
                    semantic_fields[fieldname] = {
                        "type": [Semantic],
                        "nodeid": field["nodegroupid"],
                        "nodegroupid": field["nodegroupid"],
                    }
                    if "parentnodegroup_id" in field:
                        semantic_fields[fieldname]["parentnodegroup_id"] = field["parentnodegroup_id"]
            model.update(semantic_fields)
            if name in wkrm:
                wkrm[name].update(model)
            else:
                assert "graphid" in model
                model.setdefault("model_name", name)
                WELL_KNOWN_RESOURCE_MODELS.append(model)

WEBPACK_LOADER = {
    "DEFAULT": {
        "STATS_FILE": os.path.join(APP_ROOT, 'webpack/webpack-stats.json'),
    },
}

DATATYPE_LOCATIONS.append('coral.datatypes')
FUNCTION_LOCATIONS.append('coral.functions')
ETL_MODULE_LOCATIONS.append('coral.etl_modules')
SEARCH_COMPONENT_LOCATIONS.append('coral.search_components')
TEMPLATES[0]['DIRS'].append(os.path.join(APP_ROOT, 'functions', 'templates'))
TEMPLATES[0]['DIRS'].append(os.path.join(APP_ROOT, 'widgets', 'templates'))
TEMPLATES[0]['DIRS'].insert(0, os.path.join(APP_ROOT, 'templates'))

LOCALE_PATHS.append(os.path.join(APP_ROOT, 'locale'))

FILE_TYPE_CHECKING = False
FILE_TYPES = ["bmp", "gif", "jpg", "jpeg", "pdf", "png", "psd", "rtf", "tif", "tiff", "xlsx", "csv", "zip"]

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'k#4=ji&8n4n4cy9=h7le4iw1chm=$of&0(sy=(x(tq%b@*=n70'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ROOT_URLCONF = 'coral.urls'

# Modify this line as needed for your project to connect to elasticsearch with a password that you generate
ELASTICSEARCH_CONNECTION_OPTIONS = {"timeout": 30, "verify_certs": False, "basic_auth": ("elastic", "E1asticSearchforArche5")}

# a prefix to append to all elasticsearch indexes, note: must be lower case
ELASTICSEARCH_PREFIX = 'coral'

ELASTICSEARCH_CUSTOM_INDEXES = []
for host in ELASTICSEARCH_HOSTS:
    host["scheme"] = "http"
    host["port"] = int(host["port"])
#ELASTICSEARCH_CONNECTION_OPTIONS = {"hosts": {"scheme": "http"}}
# [{
#     'module': 'coral.search_indexes.sample_index.SampleIndex',
#     'name': 'my_new_custom_index', <-- follow ES index naming rules
#     'should_update_asynchronously': False  <-- denotes if asynchronously updating the index would affect custom functionality within the project.
# }]

KIBANA_URL = "http://localhost:5601/"
KIBANA_CONFIG_BASEPATH = "kibana"  # must match Kibana config.yml setting (server.basePath) but without the leading slash,
# also make sure to set server.rewriteBasePath: true

LOAD_DEFAULT_ONTOLOGY = False
LOAD_PACKAGE_ONTOLOGIES = True
ARCHES_NAMESPACE_FOR_DATA_EXPORT = "http://arches:8000/"
SPARQL_ENDPOINT_PROVIDERS = ({"SPARQL_ENDPOINT_PROVIDER": {"en": {"values": "arches.app.utils.data_management.sparql_providers.aat_provider.AAT_Provider"}}},)

DATABASES = {
    "default": {
        "ATOMIC_REQUESTS": False,
        "AUTOCOMMIT": True,
        "CONN_MAX_AGE": 0,
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "HOST": "localhost",
        "NAME": "coral",
        "OPTIONS": {},
        "PASSWORD": "postgis",
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

INSTALLED_APPS = (
    "webpack_loader",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "arches",
    "arches.app.models",
    "arches.management",
    "guardian",
    "captcha",
    "revproxy",
    "corsheaders",
    "oauth2_provider",
    "django_celery_results",
    "compressor",
    # "silk",
    "coral",
)

MIDDLEWARE = [
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
    # "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "arches.app.utils.middleware.SetAnonymousUser",
    # "silk.middleware.SilkyMiddleware",
]

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
STATIC_URL = os.getenv("STATIC_URL", '/static/')
COMPRESS_URL = os.getenv("COMPRESS_URL", '/static/')

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = os.path.join(APP_ROOT, "staticfiles")

# when hosting Arches under a sub path set this value to the sub path eg : "/{sub_path}/"
FORCE_SCRIPT_NAME = None

RESOURCE_IMPORT_LOG = os.path.join(APP_ROOT, 'logs', 'resource_import.log')
DEFAULT_RESOURCE_IMPORT_USER = {'username': 'admin', 'userid': 1}

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
        }
    }
}


# Sets default max upload size to 15MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 15728640

# Unique session cookie ensures that logins are treated separately for each app
SESSION_COOKIE_NAME = 'coral'

# For more info on configuring your cache: https://docs.djangoproject.com/en/2.2/topics/cache/
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
    'user_permission': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'user_permission_cache',
    },
}

# Hide nodes and cards in a report that have no data
HIDE_EMPTY_NODES_IN_REPORT = False

BYPASS_UNIQUE_CONSTRAINT_TILE_VALIDATION = False
BYPASS_REQUIRED_VALUE_TILE_VALIDATION = False

DATE_IMPORT_EXPORT_FORMAT = "%Y-%m-%d" # Custom date format for dates imported from and exported to csv

# This is used to indicate whether the data in the CSV and SHP exports should be
# ordered as seen in the resource cards or not.
EXPORT_DATA_FIELDS_IN_CARD_ORDER = False

#Identify the usernames and duration (seconds) for which you want to cache the time wheel
CACHE_BY_USER = {'anonymous': 3600 * 24}
TILE_CACHE_TIMEOUT = 600 #seconds
CLUSTER_DISTANCE_MAX = 5000 #meters
GRAPH_MODEL_CACHE_TIMEOUT = None

OAUTH_CLIENT_ID = ''  #'9JCibwrWQ4hwuGn5fu2u1oRZSs9V6gK8Vu8hpRC4'

APP_VERSION = '0.20.11'
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
    SILENCED_SYSTEM_CHECKS = ["captcha.recaptcha_test_key_error"]


# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  #<-- Only need to uncomment this for testing without an actual email server
# EMAIL_USE_TLS = True
# EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = "xxxx@xxx.com"
# EMAIL_HOST_PASSWORD = 'xxxxxxx'
# EMAIL_PORT = 587

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# If True, allows for user self creation via the signup view. If False, users can only be created via the Django admin view.
ENABLE_USER_SIGNUP = False

CELERY_BROKER_URL = "" # RabbitMQ --> "amqp://guest:guest@localhost",  Redis --> "redis://localhost:6379/0"
CELERY_ACCEPT_CONTENT = ['json']
CELERY_RESULT_BACKEND = 'django-db' # Use 'django-cache' if you want to use your cache as your backend
CELERY_TASK_SERIALIZER = 'json'


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
CELERY_CHECK_ONLY_INSPECT_BROKER = False

CANTALOUPE_DIR = os.path.join(ROOT_DIR, "uploadedfiles")
CANTALOUPE_HTTP_ENDPOINT = "http://localhost:8182/"

ACCESSIBILITY_MODE = False

# By setting RESTRICT_MEDIA_ACCESS to True, media file requests outside of Arches will checked against nodegroup permissions.
RESTRICT_MEDIA_ACCESS = False

# By setting RESTRICT_CELERY_EXPORT_FOR_ANONYMOUS_USER to True, if the user is attempting
# to export search results above the SEARCH_EXPORT_IMMEDIATE_DOWNLOAD_THRESHOLD
# value and is not signed in with a user account then the request will not be allowed.
RESTRICT_CELERY_EXPORT_FOR_ANONYMOUS_USER = False

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


from arches.settings_docker import *
#COMPRESS_PRECOMPILERS = ()


# returns an output that can be read by NODEJS
if __name__ == "__main__":
    print(
        json.dumps({
            'ARCHES_NAMESPACE_FOR_DATA_EXPORT': ARCHES_NAMESPACE_FOR_DATA_EXPORT,
            'STATIC_URL': STATIC_URL,
            'COMPRESS_URL': COMPRESS_URL,
            'ROOT_DIR': ROOT_DIR,
            'APP_ROOT': APP_ROOT,
            'WEBPACK_DEVELOPMENT_SERVER_PORT': WEBPACK_DEVELOPMENT_SERVER_PORT,
        })
    )
    sys.stdout.flush()
