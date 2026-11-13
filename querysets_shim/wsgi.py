import os
import sys
import inspect

path = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = "coral.settings"

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()

from arches.app.models.system_settings import settings
settings.update_from_db()
