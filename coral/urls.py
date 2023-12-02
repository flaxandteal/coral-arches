from django.conf import settings
from django.urls import re_path
from django.contrib.staticfiles import views
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.urls import include, path
from arches.app.views.user import UserManagerView
from coral.views.group_manager import GroupManagerView
from coral.views.person_user import PersonUserSignupView
from coral.views.auth import PersonSignupView, PersonConfirmSignupView

urlpatterns = [
    path('', include('arches.urls')),
    re_path(r'^'+settings.APP_PATHNAME+'/user$', UserManagerView.as_view(), name="user_profile_manager"),
    re_path(r'^'+settings.APP_PATHNAME+'/plugins/group-manager', PluginView.as_view(), name='group-manager'),
    re_path(r'^groupmanager/(?P<grouping>[a-zA-Z_-]+)/(?P<resourceid>%s|())$' % uuid_regex, GroupManagerView.as_view(), name='groupmanager'),
    re_path(r'^'+settings.APP_PATHNAME+'person-signup', PersonSignupView.as_view(), name="person-signup"),
    re_path(r'^'+settings.APP_PATHNAME+'person-confirm-signup', PersonConfirmSignupView.as_view(), name="person-confirm-signup"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.SHOW_LANGUAGE_SWITCH is True:
#     urlpatterns = i18n_patterns(*urlpatterns)

if settings.DEBUG or settings.SERVE_STATIC:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', views.serve)
    ]
