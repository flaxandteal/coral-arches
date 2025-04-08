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
from arches.app.utils.response import JSONResponse
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseRedirect
from mimetypes import MimeTypes

@method_decorator(csrf_exempt, name="dispatch")
class TempFileView(View):
    def get(self, request, file_id):
        #file_id = request.GET.get("file_id")
        file = TempFile.objects.get(pk=file_id)
        try:    
            with file.path.open('rb') as f:
                # sending response 
                contents = f.read()
                file_mime = MimeTypes().guess_type(file.path.name)[0]
                response = HttpResponse(contents, content_type=file_mime)
                response['Content-Disposition'] = 'attachment; filename={}'.format(file.path.name.split('/')[1])

        except IOError:
            # handle file not exist case here
            response = HttpResponseNotFound('<h1>File not exist</h1>')

        return response
    
    def post(self, request):
        # print(storage_instance = storages.create_storage({"BACKEND": "package.storage.CustomStorage"}))
        print("DEBUG FILE UPLOAD", request)
        print("DEBUG FILE UPLOAD FILE", request.FILES)
        print("DEBUG FILE UPLOAD POST", request.POST)


        file_id = uuid.uuid4()
        file_name = request.POST.get("fileName", None)
        file = request.FILES.get("file", None)
        print("DEBUG file", file)
        print("DEBUG file_name", file_name)
        
        temp_file = TempFile.objects.create(fileid=file_id, path=file)
        temp_file.save()

        response_dict = {
            "file_id": file_id
        }
        print("DEBUG FILE UPLOAD POST List", list(request.POST.items()))

        print("DEBUG FILE UPLOAD FILE", vars(request.FILES))
        print("DEBUG FILE UPLOAD POST", vars(request.POST))

        return JSONResponse(response_dict)
    

