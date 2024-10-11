import logging
import os
from pdfplumber import open as open_pdf


def is_pdf(fpath, fname):
    try:
        file_path = os.path.join(fpath, fname)
        with open_pdf(file_path) as pdf:
            # Extract metadata
            metadata = pdf.metadata
            producer = metadata.get("Producer", "")
            creator = metadata.get("Creator", "")

            # Check if the PDF was produced by PowerPoint or LibreOffice
            if "PowerPoint" in producer or "pptx" in creator or "LibreOffice" in producer:
                logging.info("PPT converted to PDF (based on metadata)")
                return False

            # Fallback to aspect ratio check if metadata isn't conclusive
            page_layouts = set((page.width, page.height) for page in pdf.pages)
            aspect_ratios = [width / height for width, height in page_layouts]

            total_pages = len(aspect_ratios)
            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = total_pages - landscape_pages

            if len(set(page_layouts)) == 1:
                if aspect_ratios[0] > 1:
                    logging.info("PPT converted to PDF (based on aspect ratio)")
                    return False
                else:
                    logging.info("Likely original PDF")
                    return True

            if landscape_pages == total_pages:
                logging.info("PPT Converted to PDF (based on aspect ratio)")
                return False
            elif portrait_pages == total_pages:
                logging.info("Likely Original PDF")
                return True
            else:
                landscape_ratio = landscape_pages / portrait_pages
                if landscape_ratio > 0.7:
                    logging.info("PPT Converted to PDF (based on aspect ratio)")
                    return False
                elif landscape_ratio < 0.3:
                    logging.info("Likely Original PDF")
                    return True
                else:
                    logging.info("Mixed Layout (undetermined origin)")
                    return False

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False
