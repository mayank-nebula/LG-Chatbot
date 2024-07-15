full_data_to_save = [
            {
                "summary": f.page_content["summary"],
                "content": f.page_content["content"],
                "metadata": f.metadata,
            }
            for f in full_docs
        ]
