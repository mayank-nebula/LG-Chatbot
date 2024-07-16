def extract_content(content, file_title_to_filter):
    summaries_by_slide = {}
    with open(json_file_path, "r") as file:
        for item in ijson.items(file, "item"):
            file_title = item["metadata"]["Title"]
            slide_number = item["metadata"]["slide_number"]

            if file_title == file_title_to_filter:
                if slide_number.startswith('s'):
                    summary = item[content]
                else:
                    summary = item["summary"]
                
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

    combined_summary = "\n\n".join(
        f"{' '.join(summaries)}"
        for slide, summaries in numeric_slides + non_numeric_slides
    )

    return combined_summary


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

def question_generation(context):
    prompt_text = """
    Instructions:
    1. Assume the persona of a knowledgeable and experienced educator who specializes in generating comprehensive and insightful questions based on provided content.
    2. Read the provided context carefully.
    3. Generate 20 questions based on the context. The questions should cover a range of complexities and types, including but not limited to factual, analytical, summary, explanation, comparison, contrast, application, inference, evaluation, and synthesis.
    4. Ensure that each question is self-explanatory and does not require referring back to the context or any external documents.
    5. The questions can be based on specific parts of the context or across multiple parts of the context or the entire context.

    Context:
    {element}
    Generate the following types of questions:
    1. Factual Questions: Ask about specific details or facts mentioned in the context.
    2. Analytical Questions: Require analyzing information from the context to derive insights or conclusions.
    3. Summary Questions: Require summarizing sections or the entire context.
    4. Explanation Questions: Ask for explanations of concepts, ideas, or processes described in the context.
    5. Comparison Questions: Require comparing elements within the context.
    6. Contrast Questions: Require highlighting differences between elements within the context.
    7. Application Questions: Ask how information from the context can be applied to real-world situations or problems.
    8. Inference Questions: Require drawing inferences or conclusions based on the context.
    9. Evaluation Questions: Require evaluating information or arguments presented in the context.
    10. Synthesis Questions: Require combining elements from the context to form a new idea or perspective.

    Please proceed to generate 20 questions in JSON format with keys Sl_no, Question, Question_Type.
    """

    llm = ChatOllama(model = "llama3-gradient:8b", base_url="http://10.0.0.4:11434", temperature=0, num_ctx=64000, format="json")
    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"element": context})
    return result

for file in os.listdir("files_to_ingest"):
    file_name, ext = os.path.splitext(file)
    if ext == ".ppt" or ext == ".pptx":
        combined_summary = extract_content("summary", file_name)
    elif ext == ".doc" or ext == ".docx":
        combined_summary = extract_content("content", file_name)
    elif ext == ".pdf":
        if is_pdf("files_to_ingest", file):
            combined_summary = extract_content("content", file_name)
        else:
            combined_summary = extract_content("summary", file_name)
    else:
        continue

    combined_summary_by_title[file_name] = combined_summary

with open("combined_summary_by_title.json", "w") as file:
    json.dump(combined_summary_by_title, file, indent=4)
