'''
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
'''

import threading
import os
import sys
import inspect
import time
path = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

if path not in sys.path:
    sys.path.append(path)

# reverting back to the old style of setting the DJANGO_SETTINGS_MODULE env variable
# refer to the following blog post under the heading "Leaking of process environment variables."
# http://blog.dscpl.com.au/2012/10/requests-running-in-wrong-django.html
os.environ['DJANGO_SETTINGS_MODULE'] = "coral.settings"

from django.core.wsgi import get_wsgi_application
from django.dispatch import receiver

application = get_wsgi_application()

from arches.app.models.system_settings import settings
settings.update_from_db()

from arches.app.models.resource import resource_indexed

RUNNING = False
@receiver(resource_indexed)
def update_permissions(sender, instance, **kwargs):
    from coral.utils.casbin import SetApplicator
    # This may run too quickly
    # Instead, it should trigger a (debounced) recalc.
    # This may still require delays _between_ the upserts also.
    def _exec():
        global RUNNING
        set_applicator = SetApplicator(print_statistics=True, wait_for_completion=True)
        if RUNNING:
            return
        RUNNING = True
        try:
            set_applicator.apply_sets(resourceinstanceid=instance.resourceinstanceid)
        except Exception as exc:
            print("Apply sets failed with", exc)
            time.sleep(3.0)
        finally:
            RUNNING = False
    threading.Timer(3.0, _exec).start()

if os.getenv("CASBIN_LISTEN", False):
    print("Casbin is listening")
    from coral.permissions.casbin import trigger
    t = threading.Thread(target=trigger.listen)
    t.setDaemon(True)
    t.start()
    print("Thread started", t)
