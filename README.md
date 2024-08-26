
import os
import logging
from PyPDF2 import PdfReader

def is_pdf(fpath, fname):
    try:
        with open(os.path.join(fpath, fname), 'rb') as file:
            pdf = PdfReader(file)
            page_layouts = [(page.mediabox.width, page.mediabox.height) for page in pdf.pages]
            
            # Calculate aspect ratios
            aspect_ratios = [width / height for width, height in page_layouts]
            
            # Calculate statistics
            total_pages = len(aspect_ratios)
            landscape_pages = sum(1 for ratio in aspect_ratios if ratio > 1)
            portrait_pages = total_pages - landscape_pages
            
            # Check for consistent layout
            if len(set(page_layouts)) == 1:
                if aspect_ratios[0] > 1:
                    logging.info("PPT converted to PDF (consistent landscape)")
                    return False
                else:
                    logging.info("Likely original PDF (consistent portrait)")
                    return True
            
            # Check for mixed layouts
            landscape_ratio = landscape_pages / total_pages
            if landscape_ratio > 0.7:
                logging.info("PPT converted to PDF (mostly landscape)")
                return False
            elif landscape_ratio < 0.3:
                logging.info("Likely original PDF (mostly portrait)")
                return True
            else:
                logging.info("Mixed layout PDF (undetermined origin)")
                return True  # Assume it's an original PDF if uncertain
    
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return False
