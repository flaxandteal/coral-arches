import logging
import uuid
import base64
from PIL import Image
from django.utils.translation import gettext as _
from django.views.generic import View
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from arches.app.models.models import File, TempFile
from arches.app.models.system_settings import settings
from django.core.exceptions import PermissionDenied
from django.core.files.storage import storages
from django.core.files import File

from django.core.files.storage import default_storage    
from django.core.files.base import ContentFile

from arches.app.utils.response import JSONResponse
from arches.app.datatypes.datatypes import FileListDataType
from arches.app.models.system_settings import settings

from django.http import HttpResponse, HttpResponseNotFound, HttpResponseRedirect

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
        # print(storage_instance = storages.create_storage({"BACKEND": "package.storage.CustomStorage"}))
        print("DEBUG FILE UPLOAD", request)
        print("DEBUG FILE UPLOAD FILE", request.FILES)
        print("DEBUG FILE UPLOAD POST", request.POST)

        """
        >>> storages.backends
        {'default': {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage', 'OPTIONS': {}}, 'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}}
        """
        print("storages.backends", storages.backends)

        """
        >>> default_storage.size('/uploadedfiles/04-04-2025-12-12_planning-response-combined.docx')
        83365
        """

        uploadDirectory = settings.UPLOADED_FILES_DIR
        print("uploadDirectory", uploadDirectory)
        mediaRoot = settings.MEDIA_ROOT
        print("mediaRoot", mediaRoot)
        
        file_id = uuid.uuid4()
        file = request.FILES.get("file", None)
        print("DEBUG file", file)
        paths = []
        paths_string = ","
        for filename, file in request.FILES.items():
            # name = request.FILES[filename].name
            print("file datas", filename, file)
            file_path = "%s/%s" % (settings.UPLOADED_FILES_DIR, str(filename))
            print("path", file_path)
            paths.append(filename)

            default_storage.save(file_path, file)
        paths_string.join(paths)

        """
        Takes a comma separated string of paths.
        """
        tile_json = FileListDataType().transform_value_for_tile(paths_string)

        print("transformed Upload", tile_json)

        # temp_file = TempFile.objects.create(fileid=file_id, path=file)
        # temp_file.save()

        # response_dict = {
        #     "file_id": file_id
        # }
        # print("DEBUG FILE UPLOAD POST List", list(request.POST.items()))

        # print("DEBUG FILE UPLOAD FILE", vars(request.FILES))
        # print("DEBUG FILE UPLOAD POST", vars(request.POST))

        # file_objs = request.data.getlist("files")
        # print("DEBUG file_objs", file_objs)
        # for file_obj in file_objs:
        #     path = default_storage.save(settings.MEDIA_ROOT, ContentFile(file_obj.read()))
        #     print("images path are",path)

        """
        for file_data in files:
                file_model = models.File()
                file_model.path = file_data
                file_model.tile = tile
                if tile_exists:
                    file_model.save()
                if current_tile_data[nodeid] is not None:
                    resave_tile = False
                    updated_file_records = []
                    for file_json in current_tile_data[nodeid]:
                        if file_json["name"] == file_data.name and file_json["url"] is None:
                            file_json["file_id"] = str(file_model.pk)
                            file_json["url"] = settings.MEDIA_URL + str(file_model.fileid)
                            file_json["path"] = file_model.path.name
                            file_json["status"] = "uploaded"
                            resave_tile = True
                        updated_file_records.append(file_json)
                    if resave_tile is True:
                        # resaving model to assign url from file_model
                        # importing proxy model errors, so cannot use super on the proxy model to save
                        if previously_saved_tile.count() == 1:
                            tile_to_update = previously_saved_tile[0]
                            if user_is_reviewer:
                                tile_to_update.data[nodeid] = updated_file_records
                            else:
                                tile_to_update.provisionaledits[str(user.id)]["value"][nodeid] = updated_file_records
                            tile_to_update.save()
        """


        return JSONResponse(tile_json)
    

