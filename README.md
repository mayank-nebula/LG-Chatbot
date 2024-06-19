import os

import subprocess
from pdfplumber import open as open_pdf

from pdf_loader_MV import pdf_ingestion_MV
from ppt_loader_MV import ppt_ingestion_MV
from pdf_ppt_loader import pdf_ppt_ingestion_MV

def convert_doc_to_file(fpath, fname):
    if fname.endswith(".doc"):
        docx_fname = os.path.splitext(fname)[0] + ".docx"
        docx_file = os.path.join(fpath,docx_fname)
        subprocess.run(["unoconv", "-f", "docx", "-o", docx_file, os.path.join(fpath,fname)])

        pdf_fname = os.path.splitext(fname)[0] + ".pdf"
        pdf_file = os.path.join(fpath,pdf_fname)
        subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_file, os.path.join(fpath,docx_fname)])

        os.remove(docx_file)
        print("PDF File Created")

    elif fname.endswith(".docx"):
        pdf_fname = os.path.splitext(fname)[0] + ".pdf"
        pdf_file = os.path.join(fpath,pdf_fname)
        subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_file, os.path.join(fpath,fname)])

        print("PDF File Created")

def is_pdf(fpath, fname):
    with open_pdf(os.path.join(fpath,fname)) as pdf:
        page_layouts = set((page.width,page.height) for page in pdf.pages)
        if len(page_layouts) == 1:
            width,height = next(iter(page_layouts))
            aspect_ratio = width/height
            if aspect_ratio > 1:
                print('PPT converted to PDF')
                return False
    print('Original PDF')
    return True


def ingest_files(files_metadata, deliverables_list_metadata):
    current_folder = os.getcwd()
    parent_folder = os.path.dirname(current_folder)
    files_to_ingest_folder = os.path.join(parent_folder, current_folder, "files_to_ingest")

    for file in os.listdir(files_to_ingest_folder):
        if file.endswith(".pdf"):
            if is_pdf(files_to_ingest_folder,file):
                pdf_ingestion_MV(file, files_metadata, deliverables_list_metadata)
            else:
                pdf_ppt_ingestion_MV(file, files_metadata, deliverables_list_metadata)
            print(f"{file} processed successfully")

        elif file.endswith((".ppt", ".pptx")):
            ppt_ingestion_MV(file, files_metadata, deliverables_list_metadata)
            print(f"{file} processed successfully")

        elif file.endswith((".doc", ".docx")):
            pdf_name = os.path.splitext(file)[0] + ".pdf"
            pdf_path = os.path.join(files_to_ingest_folder, pdf_name)

            convert_doc_to_file(files_to_ingest_folder,file)
            pdf_ingestion_MV(pdf_name, files_metadata, deliverables_list_metadata)
            print(f"{file} processed successfully")

            os.remove(pdf_path)
            print("PDF File Removed")
