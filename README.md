def extract_content(content, file_title_to_filter):
    summaries_by_slide = {}
    with open(json_file_path, "r") as file:
        for item in ijson.items(file, "item"):
            file_title = item["metadata"]["Title"]
            slide_number = item["metadata"]["slide_number"]
            summary = item[content]

            if file_title == file_title_to_filter:
                if slide_number not in summaries_by_slide:
                    summaries_by_slide[slide_number] = []

                summaries_by_slide[slide_number].append(summary)
    numeric_slides = sorted(
        [
            (slide, summaries)
            for slide, summaries in summaries_by_slide.items()
            if re.match(r"\D*\d+", slide)
        ],
        key=lambda x: extract_slide_number(x[0]),
    )
    non_numeric_slides = sorted(
        [
            (slide, summaries)
            for slide, summaries in summaries_by_slide.items()
            if not re.match(r"\D*\d+", slide)
        ]
    )

    combined_summary = "\n".join(
        f"{slide}: {' '.join(summaries)}"
        for slide, summaries in numeric_slides + non_numeric_slides
    )


def is_pdf(fpath, fname):
    with open_pdf(os.path.join(fpath, fname)) as pdf:
        page_layouts = set((page.width, page.height) for page in pdf.pages)
        if len(page_layouts) == 1:
            width, height = next(iter(page_layouts))
            aspect_ratio = width / height
            if aspect_ratio > 1:
                return False
    return True


def extract_slide_number(slide):
    match = re.search(r"\d+", slide)
    return int(match.group()) if match else float("inf")

for file in os.listdir("files_to_ingest"):
    file_name, ext = os.path.splitext(file)
    if ext == ".ppt" or ext == ".pptx":
        summaries_by_slide = extract_content("summary", file_name)
    elif ext == ".doc" or ext == ".docx":
        summaries_by_slide = extract_content("content", file_name)
    else:
        if is_pdf("files_to_ingest", file):
            summaries_by_slide = extract_content("content", file_name)
        else:
            summaries_by_slide = extract_content("summary", file_name)
