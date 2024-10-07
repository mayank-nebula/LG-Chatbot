if file and file["status"] == "Processing Failed":
            return await update_progess(userEmailId, filename, status, str(file["_id"]))
        elif file and file["status"] != "Processing Failed":
            raise Exception("File already exists.")
