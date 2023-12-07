from django.conf import settings
from django.urls import re_path
from django.contrib.staticfiles import views
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.urls import include, path

urlpatterns = [
    path('', include('arches.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.SHOW_LANGUAGE_SWITCH is True:
#     urlpatterns = i18n_patterns(*urlpatterns)

if settings.DEBUG or settings.SERVE_STATIC:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', views.serve)
    ]
