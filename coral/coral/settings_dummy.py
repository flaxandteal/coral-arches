try:
    from .settings import *
except ImportError:
    pass

DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': 'dummy'
}
