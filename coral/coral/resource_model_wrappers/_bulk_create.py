import csv
from datetime import datetime
import json
import logging
import os
import uuid
import zipfile
from arches.app.search.mappings import TERMS_INDEX, RESOURCES_INDEX
from starlette_context import context
from django.db import transaction, connection
from arches.app.search.search_engine_factory import SearchEngineInstance as se
from arches.app.models.system_settings import settings as system_settings
from arches.app.models.models import ResourceXResource, TileModel, Node
from django.core.files import File
from django.core.files.storage import default_storage
from django.db import connection
from django.db.models.functions import Lower
from django.db.utils import IntegrityError, ProgrammingError
from django.utils.translation import ugettext as _
from arches.app.datatypes.datatypes import DataTypeFactory
from arches.app.models.models import GraphModel, Node, NodeGroup
from arches.app.models.system_settings import settings
import arches.app.tasks as tasks
from arches.app.utils.betterJSONSerializer import JSONSerializer
from arches.app.utils.file_validator import FileValidator
from arches.app.utils.index_database import index_resources_by_transaction
from arches.app.etl_modules.base_import_module import BaseImportModule
import arches.app.utils.task_management as task_management

logger = logging.getLogger(__name__)
FORMAT = '%(asctime)s %(message)s'
formatter = logging.Formatter(FORMAT)
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)


class BulkImportWKRM(BaseImportModule):
    moduleid = "a6af3a25-50ac-47a1-a876-bcb13dab411b"
    loadid = None

    def __init__(self, request=None):
        pass

    def validate(self):
        """
        Creates records in the load_staging table (validated before poulating the load_staging table with error message)
        Collects error messages if any and returns table of error messages
        """

        with connection.cursor() as cursor:
            cursor.execute("""SELECT * FROM __arches_load_staging_report_errors(%s)""", [self.loadid])
            rows = cursor.fetchall()
        return {"success": True, "data": rows}

    def write(self, requested_wkrms, do_index=True):
        self.loadid = str(uuid.uuid4()) # f"graphql_bulk_{int(time_mod.time())}"
        user_id = context.data["user"].id

        requested_wkrms = [(None, wkrm, None) for wkrm in requested_wkrms]
        all_wkrms = [requested_wkrms]
        while (relationships := sum([wkrm._pending_relationships for _, wkrm, _ in all_wkrms[0]], [])):
            all_wkrms = [relationships] + all_wkrms

        all_wkrm_classes = list({wkrm[1]._wkrm for wkrms in all_wkrms for wkrm in wkrms})
        mapping_details = [
            {"mapping": {k: str(v) for k, v in wkrm.nodes.items()}, "wkrmClassName": wkrm.model_class_name, "graph": wkrm.graphid}
            for wkrm in all_wkrm_classes
        ]
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO load_event (loadid, complete, status, etl_module_id, load_details, load_start_time, user_id) VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (self.loadid, False, "running", self.moduleid, json.dumps(mapping_details), datetime.now(), user_id),
            )

        crosses = []
        new_wkrms = []
        for wkrms in all_wkrms[::-1]:
            for (value, wkrm_fm, wkrm) in wkrms:
                if not wkrm_fm.id:
                    if not wkrm_fm.resource.resourceinstanceid:
                        if wkrm_fm._new_id:
                            new_id = uuid.UUID(wkrm_fm._new_id)
                        else:
                            new_id = uuid.uuid4()
                        wkrm_fm.resource.resourceinstanceid = new_id
                    wkrm_fm.id = wkrm_fm.resource.resourceinstanceid
                    new_wkrms.append(wkrm_fm)

                    for tile in wkrm_fm.resource.get_flattened_tiles():
                        tile.resourceinstance = wkrm_fm.resource

                # TODO: what happens if the cross already exists for some reason?
                if wkrm:
                    cross = ResourceXResource(
                        resourceinstanceidfrom=wkrm_fm.resource,
                        resourceinstanceidto=wkrm.resource,
                        resourceinstancefrom_graphid=wkrm_fm.resource.graph,
                        resourceinstanceto_graphid=wkrm.resource.graph,
                        created=datetime.now(),
                        modified=datetime.now()
                    )
        # during package/csv load the ResourceInstance models are not always available
                    crosses.append(cross)

                if value is not None and not value.get("resourceXresourceId", False):
                    value.update(
                        {
                            "resourceId": str(wkrm_fm.resource.resourceinstanceid),
                            "ontologyProperty": "",
                            "resourceXresourceId": str(cross.resourcexid),
                            "inverseOntologyProperty": ""
                        }
                    )

        transaction_id = uuid.uuid1()
        with transaction.atomic():
            bypass = system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION
            system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = True

            # Resource.bulk_save([wkrm.resource for wkrm in new_wkrms], transaction_id=transaction_id)

            tiles = []
            for wkrm in new_wkrms:
                resource = wkrm.resource
                resource.tiles = resource.get_flattened_tiles()
                tiles.extend([(wkrm, tile) for tile in resource.tiles])

            tiles_staging = []
            for wkrm, tile in tiles:
                nodes = [
                    (node, {
                        "value": value,
                        "valid": True, # FIXME: validate
                        "source": value, # FIXME: needs source value
                        "notes": "",
                        "datatype": "", # FIXME: get datatype
                    }) for node, value in tile.data.items()
                ]
                assert len(nodes) == len({n for n, _ in nodes})
                tiles_staging.append((wkrm, tile, dict(nodes)))

            with connection.cursor() as cursor:
                for wkrm, tile, tile_data in tiles_staging:
                    tile_value_json = JSONSerializer().serialize(tile_data)
                    cursor.execute(
                        """
                        INSERT INTO load_staging (
                            nodegroupid,
                            legacyid,
                            resourceid,
                            tileid,
                            value,
                            loadid,
                            nodegroup_depth,
                            source_description,
                            passes_validation
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (
                            tile.nodegroup_id,
                            wkrm.id,
                            wkrm.id,
                            tile.tileid,
                            tile_value_json,
                            self.loadid,
                            0,
                            f"GraphQL {wkrm._wkrm}:bulk_create>{wkrm}",
                            True,
                        ),
                    )
                cursor.execute("""CALL __arches_check_tile_cardinality_violation_for_load(%s)""", [self.loadid])

        validation = self.validate()
        logger.error("%s Validated", str(datetime.now()))
        if len(validation["data"]) != 0:
            with connection.cursor() as cursor:
                cursor.execute(
                    """UPDATE load_event SET status = %s, load_end_time = %s WHERE loadid = %s""",
                    ("failed", datetime.now(), self.loadid),
                )
            return []
        else:
            try:
                with connection.cursor() as cursor:
                    logger.error("%s Disabling regular triggers", str(datetime.now()))
                    cursor.execute("""CALL __arches_prepare_bulk_load();""", [self.loadid])
                    logger.error("%s Staging to tile [start]", str(datetime.now()))
                    cursor.execute("""SELECT * FROM __arches_staging_to_tile(%s)""", [self.loadid])
                    logger.error("%s Retrieving result", str(datetime.now()))
                    row = cursor.fetchall()
                    logger.error("%s Refreshing geometries", str(datetime.now()))
                    cursor.execute("""SELECT * FROM refresh_geojson_geometries();""", [self.loadid])
                    logger.error("%s Re-enabling regular triggers", str(datetime.now()))
                    cursor.execute("""CALL __arches_complete_bulk_load();""", [self.loadid])
                    logger.error("%s Bulk load complete", str(datetime.now()))
            except (IntegrityError, ProgrammingError) as e:
                logger.error(e)
                with connection.cursor() as cursor:
                    cursor.execute(
                        """UPDATE load_event SET status = %s, load_end_time = %s WHERE loadid = %s""",
                        ("failed", datetime.now(), self.loadid),
                    )
                return {
                    "status": 400,
                    "success": False,
                    "title": _("Failed to complete load"),
                    "message": _("Unable to insert record into staging table"),
                }

        logger.error("%s Loading event completed", str(datetime.now()))
        if row[0][0]:
            with connection.cursor() as cursor:
                cursor.execute(
                    """UPDATE load_event SET (status, load_end_time) = (%s, %s) WHERE loadid = %s""",
                    ("completed", datetime.now(), self.loadid),
                )
            #if do_index:
            #    index_resources_by_transaction(self.loadid, quiet=True, use_multiprocessing=False)
        else:
            with connection.cursor() as cursor:
                cursor.execute(
                    """UPDATE load_event SET status = %s, load_end_time = %s WHERE loadid = %s""",
                    ("failed", datetime.now(), self.loadid),
                )
            return []
            #Resource.objects.bulk_create(resources)
            #TileModel.objects.bulk_create(tiles)
            #for resource in resources:
            #    resource.save_edit(edit_type="create", transaction_id=transaction_id)

            #resources[0].tiles[0].save_edit(
            #    note=f"Bulk created: {len(tiles)} for {len(resources)} resources.", edit_type="bulk_create", transaction_id=transaction_id
            #)

            #print("Time to save resource edits: %s" % datetime.timedelta(seconds=time() - start))

            #for resource in resources:
            #    start = time()
            #    document, terms = resource.get_documents_to_index(
            #        fetchTiles=False, datatype_factory=datatype_factory, node_datatypes=node_datatypes
            #    )

            #    documents.append(se.create_bulk_item(index=RESOURCES_INDEX, id=document["resourceinstanceid"], data=document))

            #    for term in terms:
            #        term_list.append(se.create_bulk_item(index=TERMS_INDEX, id=term["_id"], data=term["_source"]))

            #se.bulk_index(documents)
            #se.bulk_index(term_list)
            #
            #TODO loadid = int(time.time())
            #TODO for tile in tiles:
            #TODO     cursor.execute(
            #TODO         """
            #TODO         INSERT INTO load_staging (
            #TODO             nodegroupid,
            #TODO             legacyid,
            #TODO             resourceid,
            #TODO             tileid,
            #TODO             value,
            #TODO             loadid,
            #TODO             nodegroup_depth,
            #TODO             source_description,
            #TODO             passes_validation
            #TODO         ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            #TODO         (
            #TODO             nodegroup,
            #TODO             legacyid,
            #TODO             resourceid,
            #TODO             tileid,
            #TODO             tile_value_json,
            #TODO             loadid,
            #TODO             node_depth,
            #TODO             csv_file_name,
            #TODO             passes_validation,
            #TODO         ),
            #TODO     )

            #TODO cursor.execute("""CALL __arches_check_tile_cardinality_violation_for_load(%s)""", [loadid])
        logger.error("%s Loading event marked", str(datetime.now()))

        logger.error("%s Adding relationships [%d]", str(datetime.now()), len(crosses))
        if crosses:
            ResourceXResource.objects.bulk_create(crosses)
        logger.error("%s Added relationships", str(datetime.now()))

        if do_index:
            logger.error("%s Indexing", str(datetime.now()))
            documents = []
            term_list = []
            for wkrm in new_wkrms:
                resource = wkrm.resource
                document, terms = resource.get_documents_to_index(
                    fetchTiles=False, datatype_factory=wkrm._datatype_factory(), node_datatypes=wkrm._node_datatypes()
                )

                documents.append(se.create_bulk_item(index=RESOURCES_INDEX, id=document["resourceinstanceid"], data=document))

                for term in terms:
                    term_list.append(se.create_bulk_item(index=TERMS_INDEX, id=term["_id"], data=term["_source"]))

            se.bulk_index(documents)
            se.bulk_index(term_list)
            with connection.cursor() as cursor:
                cursor.execute(
                    """UPDATE load_event SET (status, indexed_time, complete, successful) = (%s, %s, %s, %s) WHERE loadid = %s""",
                    ("indexed", datetime.now(), True, True, self.loadid),
                )
            logger.error("%s Indexed", str(datetime.now()))
        else:
            logger.error("%s Not indexing", str(datetime.now()))
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = bypass

        # Note that the tiles MAY HAVE CHANGED (see EDTFDataType.append_to_document) as
        # a result of indexing, so should not be subsequently saved
        return [wkrm for _, wkrm, _ in requested_wkrms]
