from docxtpl import DocxTemplate
from django.views.generic import View
from arches.app.utils.response import JSONResponse
from django.http import HttpRequest, HttpResponse
import json


class TemplateGenerator(View):
    def __init__(self):
        self.doc = None
        self.resource = None
        
    def get(self, request):
        # doc = DocxTemplate(request.GET.get('template') if request.GET.get('template') else "/home/owen/codebook/coral/new_doc.docx")
        doc = DocxTemplate("coral/docx/new_doc.docx")
        cover_letter_data = json.loads(request.GET.get('coverLetterData'))
        print("coverLETETERdata", cover_letter_data)
        print("FROM: ", cover_letter_data['from_address'])
        print("TO: ", cover_letter_data['to_address'])
        context = { 'recipient' : cover_letter_data['recipientName'],
                    'company' : cover_letter_data['companyName'],
                    'site': cover_letter_data['siteName'],
                    'licence_number': cover_letter_data['licenseNumber'],
                    'cmref': cover_letter_data['cmReference'],
                    "Date" : cover_letter_data['received'] if 'received' in cover_letter_data.keys() else '',
                    "send_date" : cover_letter_data['send_date'] if 'send_date' in cover_letter_data.keys() else '',
                    'from_address': cover_letter_data['from_address'],
                    'to_address': cover_letter_data['to_address'],

        }
        doc.render(context)
        doc.save("generated_doc.docx")
        return HttpResponse(doc, content_type='application/octet-stream')
