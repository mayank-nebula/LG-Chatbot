batch_content_split = doc_contents[start_idx:end_idx]
            batch_summary_split = doc_summaries[start_idx:end_idx]
            batch_summaries = {}
            batch_contents = {}

            for item in batch_content_split:
                key = next(iter(item))
                batch_contents = item[key]

            for item in batch_summary_split:
                key = next(iter(item))
                batch_summaries = item[key]
