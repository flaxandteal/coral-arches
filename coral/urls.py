from django.conf import settings
from django.urls import re_path
from django.contrib.staticfiles import views
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.urls import include, path
from two_factor.urls import urlpatterns as tf_urls
from coral.views.user import UserManagerView
from coral.views.api_file import TempFileView
from coral.views.group_manager import GroupManagerView
from coral.views.person_user import PersonUserSignupView
from arches.app.views.plugin import PluginView
from coral.views.auth import PersonSignupView, PersonConfirmSignupView, SetupView, LoginView, Reset2FAView, BackupCodesView
from coral.views.workflow_builder import WorkflowBuilder, WorkflowBuilderGraphComponents, WorkflowBuilderCardOverride, WorkflowBuilderWorkflowPlugins, WorkflowBuilderPluginExport, WorkflowBuilderUpdateInitWorkflow
from coral.views.open_workflow import OpenWorkflow
from coral.views.merge_resources import MergeResourcesView
from coral.views.monument_revision_remap import RemapMonumentToRevision, RemapRevisionToMonument
from coral.views.dashboard import Dashboard
from coral.views.orm import ORM
from coral.views.file_template import FileTemplateView
from coral.views.ha_number import HaNumberView
from coral.views.smr_number import SmrNumberView
from coral.views.garden_number import GardenNumberView
from coral.views.hb_number import HbNumberView
from coral.views.user_to_model import UserToModel
from coral.views.afc_number import AfcNumberView
from coral.views.ail_number import AilNumberView


uuid_regex = settings.UUID_REGEX


urlpatterns = [
    re_path(r"^auth/", LoginView.as_view(), name="auth"),
    path('account/two_factor/setup/', SetupView.as_view(), name='two_factor_setup_pending'),
    path('account/two_factor/reset/', Reset2FAView.as_view(), name='two_factor_reset'),
    path('account/two_factor/backup-codes/', BackupCodesView.as_view(), name='two_factor_backup_codes'),
    path('', include(tf_urls)),
    path('', include('arches.urls')),
    path('', include('arches_controlled_lists.urls')),
    path('', include('arches_component_lab.urls')),
    re_path(r'^user$', UserManagerView.as_view(), name="user_profile_manager"),
    re_path(r'^person/signup-link$', PersonUserSignupView.as_view(), name="person_user_signup"),
    re_path(r'^plugins/group-manager', PluginView.as_view(), name='group-manager'),
    re_path(r'^groupmanager/(?P<grouping>[a-zA-Z_-]+)/(?P<resourceid>%s|())$' % uuid_regex, GroupManagerView.as_view(), name='groupmanager'),
    re_path(r'^person-signup', PersonSignupView.as_view(), name="person-signup"),
    re_path(r'^person-confirm-signup', PersonConfirmSignupView.as_view(), name="person-confirm-signup"),
    re_path(r'^filetemplate', FileTemplateView.as_view(), name='filetemplate'),

    #
    # Workflow Builder URLs 
    #
    re_path(r'^workflow-builder/resources', WorkflowBuilder.as_view(), name='wb_resources'),
    re_path(r'^workflow-builder/graph-components', WorkflowBuilderGraphComponents.as_view(), name='wb_graph_components'),
    re_path(r"^cards/(?P<resourceid>%s|())/override$" % uuid_regex, WorkflowBuilderCardOverride.as_view(), name="api_card_override"),
    re_path(r"^workflow-builder/register", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_register"),
    re_path(r"^workflow-builder/plugins", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_plugins"),
    re_path(r"^workflow-builder/export", WorkflowBuilderPluginExport.as_view(), name="wb_export_plugin"),
    re_path(r"^workflow-builder/update", WorkflowBuilderWorkflowPlugins.as_view(), name="wb_update"),
    re_path(
        r"^workflow-builder/init-workflow",
        WorkflowBuilderUpdateInitWorkflow.as_view(),
        name="wb_update_init_workflow",
    ),

    #
    # Dashboard
    #
    re_path(r"^dashboard/resources", Dashboard.as_view(), name="dashboard"),
    re_path(r"^orm/resources", ORM.as_view(), name="orm"),


    #
    # Open Workflow
    #
    re_path(r"^open-workflow", OpenWorkflow.as_view(), name="open_workflow"),

    #
    # Merge Resources
    #
    re_path(r"^merge-resources", MergeResourcesView.as_view(), name="merge_resources"),

    #
    # Monument Revision Remap
    #
    re_path(r"^remap-monument-to-revision", RemapMonumentToRevision.as_view(), name="remap_monument_to_revision"),
    re_path(r"^remap-revision-to-monument", RemapRevisionToMonument.as_view(), name="remap_revision_to_monument"),

    #
    # Heritage Asset Number
    #
    re_path(r"^generate-ha-number", HaNumberView.as_view(), name="generate_ha_number"),
    re_path(r"^generate-smr-number", SmrNumberView.as_view(), name="generate_smr_number"),
    re_path(r"^generate-garden-number", GardenNumberView.as_view(), name="generate_garden_number"),
    re_path(r"^generate-hb-number", HbNumberView.as_view(), name="generate_hb_number"),

    #
    # Agriculture and forestry consultation number
    #
    re_path(r"^generate-afc-number", AfcNumberView.as_view(), name="generate_afc_number"),

    #
    # DAERA consultation number
    #
    re_path(r"^generate-ail-number", AilNumberView.as_view(), name="generate_ail_number"),

    #
    # User to Model
    #
    re_path(r"^user-to-model", UserToModel.as_view(), name="user_to_model"),

    #
    # api upload
    #
    re_path(r"^api/temp_file$", TempFileView.as_view(), name="api_temp_file"),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns.append(path("i18n/", include("django.conf.urls.i18n")))

if settings.DEBUG or settings.SERVE_STATIC:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', views.serve),
    ]
    if settings.DEBUG and "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns += [
            re_path("__debug__/", include("debug_toolbar.urls")),
        ]

handler400 = "arches.app.views.main.custom_400"
handler403 = "arches.app.views.main.custom_403"
handler404 = "arches.app.views.main.custom_404"
handler500 = "arches.app.views.main.custom_500"
