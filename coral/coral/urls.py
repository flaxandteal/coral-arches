from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns

urlpatterns = [
    url(r'^', include('arches.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.SHOW_LANGUAGE_SWITCH is True:
#     urlpatterns = i18n_patterns(*urlpatterns)
