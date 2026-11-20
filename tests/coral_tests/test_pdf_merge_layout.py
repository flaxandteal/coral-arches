"""Guards how an extracted response letter is laid out in the merged document.

Run inside the app container:
`docker exec -i coral-arches-1 bash -c 'cd /web_root/coral && ../ENV/bin/python manage.py shell -c "exec(open(\"tests/coral_tests/test_pdf_merge_layout.py\").read(), {\"__name__\": \"__main__\"})"'`
"""

from docx import Document

from coral.views.file_template import FileTemplateView


def seg(text, x, y, width):
    return {"text": text, "x": x, "y": y, "width": width, "height": 11, "page": 0}


def merged(segments):
    view = FileTemplateView()
    view.doc = Document()
    paragraph = view.doc.add_paragraph()
    view.replace_pdf_extract(paragraph, segments)
    return paragraph.text


def test_layout():
    text = merged([
        seg("Considerations", 72, 100, 80),
        seg("A wrapped sentence that runs right across the", 72, 113, 440),
        seg("page and ends here.", 72, 126, 100),
        seg("", 90, 139, 5),
        seg("We are content.", 108, 139, 80),
        seg("Planning Act (NI) runs right across the page to", 72, 152, 440),
        seg("2011. Next", 72, 165, 60),
        seg("will", 72, 178, 20),
        seg("not", 95, 178, 15),
    ])
    assert text == (
        "Considerations\n"
        "A wrapped sentence that runs right across the page and ends here.\n"
        "• We are content.\n"
        "Planning Act (NI) runs right across the page to 2011. Next\n"
        "will not"
    ), repr(text)


if __name__ == "__main__":
    test_layout()
    print("ok")
