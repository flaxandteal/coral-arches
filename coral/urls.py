from django.conf import settings
from django.urls import re_path
from django.contrib.staticfiles import views
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.urls import include, path
from arches.app.views.user import UserManagerView
from coral.views.group_manager import GroupManagerView
from coral.views.person_user import PersonUserSignupView
from arches.app.views.plugin import PluginView
from coral.views.auth import PersonSignupView, PersonConfirmSignupView
from coral.views.workflow_builder import WorkflowBuilder, WorkflowBuilderGraphComponents, WorkflowBuilderCardOverride, WorkflowBuilderWorkflowPlugins, WorkflowBuilderPluginExport


uuid_regex = settings.UUID_REGEX


urlpatterns = [
    path('', include('arches.urls')),
    re_path(r'^user$', UserManagerView.as_view(), name="user_profile_manager"),
    re_path(r'^person/signup-link$', PersonUserSignupView.as_view(), name="person_user_signup"),
    re_path(r'^plugins/group-manager', PluginView.as_view(), name='group-manager'),
    re_path(r'^groupmanager/(?P<grouping>[a-zA-Z_-]+)/(?P<resourceid>%s|())$' % uuid_regex, GroupManagerView.as_view(), name='groupmanager'),
    re_path(r'^person-signup', PersonSignupView.as_view(), name="person-signup"),
    re_path(r'^person-confirm-signup', PersonConfirmSignupView.as_view(), name="person-confirm-signup"),

    #
    # Workflow Builder URLs 
    #
    url(r'^workflow-builder/resources', WorkflowBuilder.as_view(), name='wb_resources'),
    url(r'^workflow-builder/graph-components', WorkflowBuilderGraphComponents.as_view(), name='wb_graph_components'),
    url(r"^cards/(?P<resourceid>%s|())/override$" % uuid_regex, WorkflowBuilderCardOverride.as_view(), name="api_card_override"),
    url(r"^workflow-builder/register", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_register"),
    url(r"^workflow-builder/plugins", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_plugins"),
    url(r"^workflow-builder/export", WorkflowBuilderPluginExport.as_view(), name="wb_export_plugin"),
    url(r"^workflow-builder/update", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_update"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.SHOW_LANGUAGE_SWITCH is True:
#     urlpatterns = i18n_patterns(*urlpatterns)

if settings.DEBUG or settings.SERVE_STATIC:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', views.serve),
    ]
    if settings.DEBUG:
        urlpatterns += [
            re_path("__debug__/", include("debug_toolbar.urls")),
        ]
