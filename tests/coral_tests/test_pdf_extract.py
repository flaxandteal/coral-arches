"""Guards which lines of an uploaded response letter go into the merged document.

Needs only pymupdf: `python tests/coral_tests/test_pdf_extract.py`
"""

import os
import sys

import pymupdf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "coral", "views"))
from pdf_extract import PdfExtract


def letter():
    doc = pymupdf.open()
    for body in (["Section Reference:  HB02 12 012", "Considerations"], ["Carried over"]):
        page = doc.new_page(width=612, height=792)
        page.insert_text((72, 55), "HED (Historic Buildings)")
        y = 90
        for line in body:
            page.insert_text((72, y), line)
            y += 20
        page.insert_text((72, 745), "Planning ref: LA01/2026/1012/F")
    return doc.tobytes()


def test_marker_in_header_band_and_running_lines_dropped():
    texts = [item["text"] for item in PdfExtract().extract_text(letter())]
    assert texts == ["Section Reference:  HB02 12 012", "Considerations", "Carried over"], texts


if __name__ == "__main__":
    test_marker_in_header_band_and_running_lines_dropped()
    print("ok")
