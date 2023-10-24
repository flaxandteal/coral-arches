from docxtpl import DocxTemplate
from django.views.generic import View
from arches.app.utils.response import JSONResponse
from django.http import HttpRequest, HttpResponse
import time
import json


class TemplateGenerator(View):
    def __init__(self):
        self.doc = None
        self.resource = None
        
    def get(self, request):
        name = request.GET.get('name') if request.GET.get('name') else "cover-letter-" + str(time.time()) + ".docx"
        print("SELECTED TEMPLATE ", request.GET.get('template'))
        template = "coral/docx/" + request.GET.get('template') if request.GET.get('template') else 'coral/docx/new_doc.docx'
        doc = DocxTemplate(template)
        cover_letter_data = json.loads(request.GET.get('coverLetterData'))

        context = { 
            'recipient' : cover_letter_data['recipientName'],
            'company' : cover_letter_data['companyName'],
            'site': cover_letter_data['siteName'],
            'licence_number': cover_letter_data['licenseNumber'],
            'cmref': cover_letter_data['cmReference'],
            'Date' : cover_letter_data['received'] if 'received' in cover_letter_data.keys() else '',
            'send_date' : cover_letter_data['send_date'] if 'send_date' in cover_letter_data.keys() else '',
            'from_address': cover_letter_data['from_address'],
            'to_address': cover_letter_data['to_address'],
        }

        doc.render(context)
        doc.save("coral/docx/temp" + name)
        file = open("coral/docx/temp" + name, 'rb')
        return HttpResponse(file, content_type='application/octet-stream')
