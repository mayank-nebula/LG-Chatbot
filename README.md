def add_documents(retriever, doc_summaries, doc_contents):
        doc_ids = [str(uuid.uuid4()) for _ in doc_contents]
        summary_docs = [
            Document(
                page_content=s,
                metadata={
                    id_key: doc_ids[i],
                    "id": file_metadata["ID"],
                    "Title": title,
                    "ContentTags": deliverables_list_metadata["ContentTags"],
                    "Abstract": deliverables_list_metadata["Abstract"],
                    "Region": deliverables_list_metadata["Region"],
                    "StrategyArea": deliverables_list_metadata["StrategyArea"],
                    "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                    "Country": deliverables_list_metadata["Country"],
                    "Country_x003a_CountryFusionID": deliverables_list_metadata[
                        "Country_x003a_CountryFusionID"
                    ],
                    "ContentTypes": deliverables_list_metadata["ContentTypes"],
                    "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                    "DeliverablePermissions": deliverables_list_metadata[
                        "DeliverablePermissions"
                    ],
                    "source": file_metadata["WebUrl"],
                    "deliverables_list_metadata": f"{deliverables_list_metadata}",
                    "slide_number": img_name,
                },
            )
            for i, (img_name, s) in enumerate(doc_summaries.items())
        ]
        retriever.vectorstore.add_documents(summary_docs)
        full_docs = [
            Document(
                page_content=json.dumps(
                    {"summary": doc_summaries[img_name], "content": s}
                ),
                metadata={
                    id_key: doc_ids[i],
                    "id": file_metadata["ID"],
                    "Title": title,
                    "ContentTags": deliverables_list_metadata["ContentTags"],
                    "Abstract": deliverables_list_metadata["Abstract"],
                    "Region": deliverables_list_metadata["Region"],
                    "StrategyArea": deliverables_list_metadata["StrategyArea"],
                    "StrategyAreaTeam": deliverables_list_metadata["StrategyAreaTeam"],
                    "Country": deliverables_list_metadata["Country"],
                    "Country_x003a_CountryFusionID": deliverables_list_metadata[
                        "Country_x003a_CountryFusionID"
                    ],
                    "ContentTypes": deliverables_list_metadata["ContentTypes"],
                    "Country_x003a_ID": deliverables_list_metadata["Country_x003a_ID"],
                    "DeliverablePermissions": deliverables_list_metadata[
                        "DeliverablePermissions"
                    ],
                    "source": file_metadata["WebUrl"],
                    "deliverables_list_metadata": f"{deliverables_list_metadata}",
                    "slide_number": img_name,
                },
            )
            for i, (img_name, s) in enumerate(doc_contents.items())
        ]
        retriever.docstore.mset(list(zip(doc_ids, full_docs)))



def split_image_text_types(docs):
    """Split base64-encoded images, texts, and metadata"""
    b64_images = []
    texts = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            print(file_permission_list)
            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                doc_content = doc.page_content
                title = doc.metadata["Title"]
                link = doc.metadata["source"]
                slide_number = doc.metadata["slide_number"]

                concatinated_title = f"{title} - {slide_number}"

                if concatinated_title in sources:
                    if link in sources[concatinated_title]:
                        continue
                    else:
                        sources[concatinated_title].append(link)
                else:
                    sources[concatinated_title] = link

                if looks_like_base64(doc_content) and is_image_data(doc_content):
                    doc_content = resize_base64_image(doc_content, size=(1300, 600))
                    b64_images.append(doc_content)
                else:
                    texts.append(doc_content)
            else:
                continue

    return {
        "images": b64_images,
        "texts": texts,
    }


        
