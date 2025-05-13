import pymupdf

class PdfExtract():
    def __init__(self):
        pass

    def extract_data(self, pdf_bytes):
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        extracted_data = []
        
        for page_no in range(doc.page_count):
            page_data = []
            page = doc.load_page(page_no)
            text_dict = page.get_text("dict")

            for block in text_dict["blocks"]:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if span["text"].strip() != "":
                            page_data.append({
                                "type": "text",
                                "page": page_no,
                                "text": span["text"],
                                "x": span["bbox"][0],
                                "y": span["bbox"][1],
                                "width": span["bbox"][2] - span["bbox"][0],
                                "height": span["bbox"][3] - span["bbox"][1],
                                "font": span["font"],
                                "is_bold": "Bold" in span["font"] or "F1" in span["font"],
                                "size": span["size"],
                                "bg": span.get("bg")
                            })
            extracted_data.append(page_data)

        return extracted_data 
    
    def extract_text(self, pdf_bytes, footer_threshold = 750, header_threshold = 100):
        data = self.extract_data(pdf_bytes)
        output_data = []
        start_marker = "Section Reference:"
        record = False

        for page in data:
            page.sort(key=lambda item: item["y"])
            for item in page:
                text = item["text"]
                if item["y"] > footer_threshold or item["y"] < header_threshold:
                    continue
                if start_marker in text:
                    record = True
                if record:
                    output_data.append(item)

        print("THIS", output_data)

        return output_data
