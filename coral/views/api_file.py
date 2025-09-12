import json
import os
import uuid
from django.utils.translation import gettext as _
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from arches.app.models.models import TempFile
from arches.app.models.system_settings import settings
from arches.app.models.tile import Tile as TileProxyModel
from arches.app.views.tile import TileData

from django.core.files.storage import default_storage    

from arches.app.utils.response import JSONResponse
from arches.app.datatypes.datatypes import FileListDataType
from arches.app.models.system_settings import settings

from django.http import HttpRequest, HttpResponse, HttpResponseNotFound

from mimetypes import MimeTypes

from requests import Request

@method_decorator(csrf_exempt, name="dispatch")
class TempFileView(View):
    def get(self, request, file_id):
        #file_id = request.GET.get("file_id")
        file = TempFile.objects.get(pk=file_id)
        try:    
            with file.path.open("rb") as f:
                # sending response 
                contents = f.read()
                file_mime = MimeTypes().guess_type(file.path.name)[0]
                response = HttpResponse(contents, content_type=file_mime)
                response["Content-Disposition"] = "attachment; filename={}".format(file.path.name.split("/")[1])

        except IOError:
            # handle file not exist case here
            response = HttpResponseNotFound("<h1>File not exist</h1>")

        return response
    
    def post(self, request: Request):
        host = request.get_host()
        transaction_id = request.POST.get("transaction_id", uuid.uuid1())

        file_list_node_id = "96f8830a-8490-11ea-9aba-f875a44e0e11"  # Digital Object
        tileid = request.GET.get("tileid", None)
        resourceid = request.GET.get("resourceid", "")
        file = request.FILES.get("file", None)
        paths = []
        if tileid and tileid != "":
            tile = TileProxyModel.objects.get(pk=tileid)
        else:
            tile = TileProxyModel.get_blank_tile_from_nodegroup_id("7db68c6c-8490-11ea-a543-f875a44e0e11",resourceid=resourceid)

        fileNames = list(map(lambda fileObject: str(fileObject),request.FILES.values()))
        paths = list(map(lambda name:  "%s/%s" % (settings.UPLOADED_FILES_DIR, name), fileNames))
        tile_json = FileListDataType().transform_value_for_tile(",".join(paths))
        processedTile = tile.data[file_list_node_id] if tile.data[file_list_node_id] else []
        for filename, file in request.FILES.items():
            # name = request.FILES[filename].name
            file_path = "%s/%s" % (settings.UPLOADED_FILES_DIR, str(file))
            # stat = os.stat(os.path.join(settings.APP_ROOT, file_path))

            default_storage.save(file_path, file)
            tiledata = next((x for x in tile_json if x['name'] == str(file)), None)
            processedTile.append({
                "accepted": tiledata['accepted'],
                "content": "blob:" + host + "/{0}".format(uuid.uuid4()),
                "description": None,
                "file_id": str(tiledata['file_id']) if tiledata and tiledata['file_id'] else None,
                "index": 0,
                "lastModified": None,
                "name": str(file),
                "path": file_path,
                "size": file.size,
                "status": tiledata['status'] or "queued",
                "type": tiledata['type'],
                "url": tiledata['url']
            })

        tile = json.dumps(
            {
                "tileid": str(tileid) if tileid else None,
                "data": {
                    file_list_node_id: processedTile
                },
                "nodegroup_id": "7db68c6c-8490-11ea-a543-f875a44e0e11",
                "parenttile_id": None,
                "resourceinstance_id": str(resourceid) if resourceid else "",
                "sortorder": 0,
                "tiles": {},
            }
        )

        new_req = HttpRequest()
        new_req.method = "POST"
        new_req.user = request.user
        new_req.POST["data"] = tile
        new_req.POST["transaction_id"] = transaction_id
        # new_req.FILES["file-list_" + file_list_node_id] = UploadedFile(file)
        new_tile = TileData()
        new_tile.action = "update_tile"
        response = TileData.post(new_tile, new_req)
        if response.status_code == 200:
            tile = json.loads(response.content)
            return JSONResponse({"tile": tile, "status": "success"})

        return HttpResponseNotFound(response.status_code)



    

