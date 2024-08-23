docstore_path = os.path.join(
        current_dir,
        "docstores_normal_rag_1",
        f"{title}.pkl",
    )
    if os.path.exists(docstore_path):
        docstore_path = os.path.join(
            current_dir,
            "docstores_normal_rag_1",
            f"{title}_{uuid.uuid4()}.pkl",
        )
