from arches.app.views.plugin import PluginView
from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static
from coral.views.file_template import FileTemplateView
from coral.views.index import IndexView
from django.views.generic import RedirectView
from coral.views.resource import ResourceDescriptors
from coral.views.active_consultations import ActiveConsultationsView
from arches.app.views import main
from arches.app.views.user import UserManagerView
from coral.views.graph_component_export import GraphComponentExport
from coral.views.workflow_builder import WorkflowBuilder, WorkflowBuilderGraphComponents, WorkflowBuilderCardOverride, WorkflowBuilderWorkflowPlugins, WorkflowBuilderPluginExport


uuid_regex = settings.UUID_REGEX

urlpatterns = [
    url(r'^$', IndexView.as_view(), name='root'),
    url(r'^'+settings.APP_PATHNAME+'/$', IndexView.as_view(), name='consultations-root'),
    url(r'^index.htm', IndexView.as_view(), name='home'),
    url(r'^'+settings.APP_PATHNAME+'/index.htm', IndexView.as_view(), name='consultations-home'),
    url(r'^'+settings.APP_PATHNAME+'/', include('arches.urls')),
    url(r'^plugins/active-consultations$', RedirectView.as_view(url='/'+settings.APP_PATHNAME+'/plugins/active-consultations')),
    url(r'^resource/descriptors/(?P<resourceid>%s|())$' % uuid_regex, ResourceDescriptors.as_view(), name="resource_descriptors"),
    url(r'^'+settings.APP_PATHNAME+'/index.htm', IndexView.as_view(), name='home'),
    url(r'^', include('arches.urls')),
    url(r'^'+settings.APP_PATHNAME+'/user$', UserManagerView.as_view(), name="user_profile_manager"),
    url(r'^filetemplate', FileTemplateView.as_view(), name='filetemplate'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/active-consultations', PluginView.as_view(), name='active-consultations'),
    url(r'^activeconsultations', ActiveConsultationsView.as_view(),
        name='activeconsultations'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/consultation-workflow', PluginView.as_view(), name='consultation-workflow'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/application-area', PluginView.as_view(), name='application-area'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/site-visit', PluginView.as_view(), name='site-visit'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/correspondence-workflow', PluginView.as_view(), name='correspondence-workflow'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/communication-workflow', PluginView.as_view(), name='communication-workflow'),
    url(r'^'+settings.APP_PATHNAME+'/plugins/init-workflow', PluginView.as_view(), name='init-workflow'),
    url(r'^graph-component-export', GraphComponentExport.as_view(), name='graph-mapping-dump'),
    url(r'^workflow-builder/resources', WorkflowBuilder.as_view(), name='wb_resources'),
    url(r'^workflow-builder/graph-components', WorkflowBuilderGraphComponents.as_view(), name='wb_graph_components'),
    url(r"^cards/(?P<resourceid>%s|())/override$" % uuid_regex, WorkflowBuilderCardOverride.as_view(), name="api_card_override"),
    url(r"^workflow-builder/register", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_register"),
    url(r"^workflow-builder/plugins", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_plugins"),
    url(r"^workflow-builder/export", WorkflowBuilderPluginExport.as_view(), name="wb_export_plugin")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.SHOW_LANGUAGE_SWITCH is True:
#     urlpatterns = i18n_patterns(*urlpatterns)

