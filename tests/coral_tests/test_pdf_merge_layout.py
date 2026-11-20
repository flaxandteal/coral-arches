"""Guards how an extracted response letter is laid out in the merged document.

Run inside the app container:
`docker exec -i coral-arches-1 bash -c 'cd /web_root/coral && ../ENV/bin/python manage.py shell -c "exec(open(\"tests/coral_tests/test_pdf_merge_layout.py\").read(), {\"__name__\": \"__main__\"})"'`
"""

from docx import Document

from coral.views.file_template import FileTemplateView

WORD_BULLET = ""


def seg(text, x, y, width):
    return {"text": text, "x": x, "y": y, "width": width, "height": 11, "page": 0}


def merged(segments):
    """Each paragraph as (left indent, first-line indent, text), indents in points."""
    view = FileTemplateView()
    view.doc = Document()
    view.replace_pdf_extract(view.doc.add_paragraph(), segments)
    return [
        (round(p.paragraph_format.left_indent.pt), round(p.paragraph_format.first_line_indent.pt), p.text)
        for p in view.doc.paragraphs
    ]


def test_layout():
    assert merged([
        seg("Considerations", 72, 100, 80),
        seg("A wrapped sentence that runs right across the", 72, 113, 440),
        seg("page and ends here, with a self-", 72, 126, 440),
        seg("contained word.", 72, 139, 80),
        seg(WORD_BULLET, 90, 152, 5),
        seg("A bullet that runs right across the page and", 108, 152, 404),
        seg("wraps.", 108, 165, 40),
        seg(WORD_BULLET, 126, 178, 5),
        seg("A nested bullet.", 144, 178, 80),
        seg("Planning Act (NI) runs right across the page to", 72, 191, 440),
        seg("2011. Next", 72, 204, 60),
        seg("will", 72, 217, 20),
        seg("not", 95, 217, 15),
    ]) == [
        (0, 0, "Considerations"),
        (0, 0, "A wrapped sentence that runs right across the page and ends here, with a self-contained word."),
        (36, -18, "●\tA bullet that runs right across the page and wraps."),
        (72, -18, "○\tA nested bullet."),
        (0, 0, "Planning Act (NI) runs right across the page to 2011. Next will not"),
    ]


def test_indented_section_wider_than_body():
    assert [text for _, _, text in merged([
        seg("Body text wraps at a narrower margin than the", 72, 100, 400),
        seg("in body. Indented text runs to a wider margin", 108, 113, 440),
        seg("Body text again, wrapping at its margin of", 72, 126, 400),
        seg("Coleraine as designated.", 72, 139, 120),
    ])] == [
        "Body text wraps at a narrower margin than the in body. Indented text runs to a wider margin "
        "Body text again, wrapping at its margin of Coleraine as designated."
    ]


if __name__ == "__main__":
    test_layout()
    test_indented_section_wider_than_body()
    print("ok")
