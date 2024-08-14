if os.path.exists(summary_json_path):
            with open(summary_json_path, "r") as f:
                existing_summary_data = json.load(f)
            existing_summary_data.extend(summary_data_to_save)
        else:
            existing_summary_data = summary_data_to_save

        with open(summary_json_path, "w") as f:
            json.dump(existing_summary_data, f, indent=4)

        if os.path.exists(full_docs_json_path):
            with open(full_docs_json_path, "r") as f:
                existing_full_data = json.load(f)
            existing_full_data.extend(full_data_to_save)
        else:
            existing_full_data = full_data_to_save

        with open(full_docs_json_path, "w") as f:
            json.dump(existing_full_data, f, indent=4)
