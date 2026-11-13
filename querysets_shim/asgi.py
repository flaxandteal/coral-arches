import os
import sys
import inspect

path = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = "coral.settings"

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coral.settings')
django.setup()

from django.core.asgi import get_asgi_application

application = get_asgi_application()

from arches.app.models.system_settings import settings
settings.update_from_db()
