async def process_file_async(
    user_email_id: str,
    file_path: str,
    filename: str,
    folder_path: str,
    create_progress_id: str,
    type_of_mail: str,
    old_folder_name: str,
    new_folder_name: str,
    workspace_id: str,
    tags: List[str],
) -> None:
    try:
        new_attachments = None
        attachment_collection = get_attachment_collection(workspace_id=workspace_id)
        attachment_doc = await attachment_collection.find_one(
            {"_id": ObjectId(create_progress_id)}
        )

        if attachment_doc:
            existing_attachment = attachment_doc.get("filename", [])
        else:
            existing_attachment = []

        _, ext = os.path.splitext(filename)
        if ext in [".msg", ".eml"]:
            attachment_name = mail_content_extraction(file_path=file_path)
            if attachment_name:
                new_attachments = {
                    "_id": ObjectId(create_progress_id),
                    "userEmailId": user_email_id,
                    "userFullName": extract_full_name(user_email_id=user_email_id),
                    "filename": encrypt_data(
                        data=attachment_name, key=config.ENCRYPT_DECRYPT_KEY
                    ),
                    "createdAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc),
                }
        else:
            new_attachments = {
                "_id": ObjectId(create_progress_id),
                "userEmailId": user_email_id,
                "userFullName": extract_full_name(user_email_id=user_email_id),
                "filename": encrypt_data(
                    data=[filename], key=config.ENCRYPT_DECRYPT_KEY
                ),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }

        await update_progess(
            status="Processing",
            id=create_progress_id,
            type_of_mail=type_of_mail,
            workspace_id=workspace_id,
        )
        await publish_message(
            user_email_id=user_email_id,
            payload={
                "file_id": create_progress_id,
                "filename": filename,
                "process": "Processing",
                "reason": "Processing",
            },
        )

        llm_generated_tags = await ingest_files(
            filepath=file_path,
            created_id=create_progress_id,
            type_of_mail=type_of_mail,
            existing_attachment=decrypt_data(
                data=existing_attachment, key=config.ENCRYPT_DECRYPT_KEY
            ),
            workspace_id=workspace_id,
            tags=tags,
        )
        await update_progess(
            status="Ingestion Successful",
            id=create_progress_id,
            type_of_mail=type_of_mail,
            workspace_id=workspace_id,
        )
        await publish_message(
            user_email_id=user_email_id,
            payload={
                "file_id": create_progress_id,
                "filename": filename,
                "tags": llm_generated_tags,
                "process": "Ingestion Successful",
                "reason": "Ingestion Successful",
            },
        )

        if type_of_mail in ["Full-Chain", "Sub-Chain"]:
            transfer_files(
                old_folder=old_folder_name,
                new_folder=new_folder_name,
                mail_type=type_of_mail,
                workspace_id=workspace_id,
            )
        tags_to_save = llm_generated_tags if llm_generated_tags else tags
        if attachment_doc:
            await attachment_collection.update_one(
                {"_id": ObjectId(create_progress_id)},
                {
                    "$push": {
                        "filename": {
                            "$each": encrypt_data(
                                data=attachment_name, key=config.ENCRYPT_DECRYPT_KEY
                            )
                        }
                    },
                    "$set": {
                        "updatedAt": datetime.now(timezone.utc),
                        "tags": tags_to_save,
                    },
                },
            )
        elif new_attachments:
            new_attachments["tags"] = tags_to_save
            await attachment_collection.insert_one(new_attachments)
    except Exception as e:
        print("hi")
        shutil.rmtree(folder_path)
        delete_from_collection(
            id=create_progress_id,
            workspace_id=workspace_id,
        )
        await delete_from_structured_collection(
            ids=[create_progress_id],
            workspace_id=workspace_id,
        )
        await delete_from_attachment_collection(
            ids=[create_progress_id],
            workspace_id=workspace_id,
        )
        await update_progess(
            status="Processing Failed",
            id=create_progress_id,
            type_of_mail=type_of_mail,
            type="failed",
            workspace_id=workspace_id,
        )
        await publish_message(
            user_email_id=user_email_id,
            payload={
                "file_id": create_progress_id,
                "filename": filename,
                "process": "Processing Failed",
                "reason": f"{str(e)}",
            },
        )
        logger.exception(f"Error occurred while processing file {filename}: {str(e)}")
    finally:
        try:
            while True:
                queued_task = await manager.process_task_by_user_and_id(
                    workspace_id=workspace_id, queued_mail_reference=create_progress_id
                )
                if not queued_task:
                    break

                (
                    created_id_queue,
                    type_of_mail_queue,
                    old_folder_name_queue,
                    new_folder_name_queue,
                    _,
                ) = await create_progress(
                    user_email_id=queued_task.user_email_id,
                    filename=queued_task.filename,
                    status="Upload Successful",
                    filesize=queued_task.filesize,
                    current_time=queued_task.current_time,
                    filepath=queued_task.folder_path,
                    workspace_id=queued_task.workspace_id,
                    tags=queued_task.tags,
                )

                await publish_message(
                    user_email_id=user_email_id,
                    payload={
                        "file_id": queued_task.create_progress_id,
                        "filename": queued_task.filename,
                        "process": "",
                        "reason": "Delete this queued file",
                    },
                )

                await delete_files(
                    ids=[queued_task.create_progress_id],
                    workspace_id=queued_task.workspace_id,
                )

                await process_file_async(
                    user_email_id=user_email_id,
                    file_path=queued_task.file_path,
                    filename=queued_task.filename,
                    folder_path=queued_task.folder_path,
                    create_progress_id=created_id_queue,
                    type_of_mail=type_of_mail_queue,
                    old_folder_name=old_folder_name_queue,
                    new_folder_name=new_folder_name_queue,
                    workspace_id=queued_task.workspace_id,
                    tags=queued_task.tags,
                )
        except Exception as e:
            print(e)
