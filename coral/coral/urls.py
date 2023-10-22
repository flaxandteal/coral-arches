from arches.app.views.plugin import PluginView
from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from coral.views.file_template import FileTemplateView
from coral.views.index import IndexView
from django.views.generic import RedirectView
from coral.views.resource import ResourceDescriptors
from coral.views.active_consultations import ActiveConsultationsView
from coral.views.group_manager import GroupManagerView
from coral.views.person_user import PersonUserSignupView
from arches.app.views import main
from arches.app.views.user import UserManagerView
from coral.views.auth import PersonSignupView, PersonConfirmSignupView

uuid_regex = settings.UUID_REGEX

urlpatterns = [
    url(r'^$', IndexView.as_view(), name='root'),
    url(r'^'+settings.APP_PATHNAME+'/$', IndexView.as_view(), name='consultations-root'),
    url(r'^index.htm', IndexView.as_view(), name='home'),
    url(r'^'+settings.APP_PATHNAME+'/index.htm', IndexView.as_view(), name='consultations-home'),
    url(r'^'+settings.APP_PATHNAME+'/', include('arches.urls')),
    url(r'^resource/descriptors/(?P<resourceid>%s|())$' % uuid_regex, ResourceDescriptors.as_view(), name="resource_descriptors"),
    url(r'^'+settings.APP_PATHNAME+'/index.htm', IndexView.as_view(), name='home'),
    url(r'^', include('arches.urls')),
    url(r'^'+settings.APP_PATHNAME+'/user$', UserManagerView.as_view(), name="user_profile_manager"),
    url(r'^'+settings.APP_PATHNAME+'person/signup-link$', PersonUserSignupView.as_view(), name="person_user_signup"),
    url(r'^filetemplate', FileTemplateView.as_view(), name='filetemplate'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/active-consultations', PluginView.as_view(), name='active-consultations'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/group-manager', PluginView.as_view(), name='group-manager'),
    url(r'^activeconsultations', ActiveConsultationsView.as_view(),
        name='activeconsultations'),
    url(r'^groupmanager/(?P<grouping>[a-zA-Z_-]+)/(?P<resourceid>%s|())$' % uuid_regex, GroupManagerView.as_view(), name='groupmanager'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/consultation-workflow', PluginView.as_view(), name='consultation-workflow'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/application-area', PluginView.as_view(), name='application-area'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/site-visit', PluginView.as_view(), name='site-visit'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/correspondence-workflow', PluginView.as_view(), name='correspondence-workflow'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/communication-workflow', PluginView.as_view(), name='communication-workflow'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/init-workflow', PluginView.as_view(), name='init-workflow'),
    url(r'^'+settings.APP_PATHNAME+'person-signup', PersonSignupView.as_view(), name="person-signup"),
    url(r'^'+settings.APP_PATHNAME+'person-confirm-signup', PersonConfirmSignupView.as_view(), name="person-confirm-signup"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.SHOW_LANGUAGE_SWITCH is True:
#     urlpatterns = i18n_patterns(*urlpatterns)
