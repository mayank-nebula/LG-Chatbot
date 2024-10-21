async def upload_files(
    userEmailId: str,
    files: List[UploadFile],
    # , background_tasks: BackgroundTasks
):
    loop = asyncio.get_event_loop()
    user_dir = create_user_directory(userEmailId)
    filenames = []
    failed_files = []

    for file in files:
        if not file.filename:
            failed_files.append("Unnamed file")
            continue

        try:
            created_id = None
            current_time = datetime.utcnow()
            formatted_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
            file_folder = os.path.join(
                user_dir, f"{os.path.splitext(file.filename)[0]}_{formatted_time}"
            )

            os.makedirs(file_folder, exist_ok=True)
            file_path, created_id, filesize = await save_uploaded_file(
                file, file_folder, False, userEmailId, current_time
            )
            filenames.append({"filename": file.filename, "size": filesize})

            await manager.send_message(
                {
                    "filename": file.filename,
                    "process": "Upload Successful",
                    "reason": "Upload Successful",
                },
                userEmailId,
            )

            # background_tasks.add_task(
            #     process_file_async,
            #     userEmailId,
            #     file_path,
            #     file.filename,
            #     file_folder,
            #     created_id,
            # )
            loop.run_in_executor(
                executor,
                process_file_async,
                userEmailId,
                file_path,
                file.filename,
                file_folder,
                created_id,
            )
        except Exception as e:
            if created_id:
                await update_progess(userEmailId, "Processing Failed", created_id)
            else:
                await create_progess(
                    userEmailId,
                    file.filename,
                    "Processing Failed",
                    0,
                    current_time,
                    ".",
                )
            await manager.send_message(
                {
                    "filename": file.filename,
                    "process": "Processing Failed",
                    "reason": str(e),
                },
                userEmailId,
            )
            shutil.rmtree(file_folder)
            failed_files.append(f"{file.filename}: {str(e)}")

    if filenames:
        status = True
        if failed_files:
            message = f"Uploaded {len(filenames)} file(s), {len(failed_files)} file(s) failed."
        else:
            message = f"Successfully uploaded {len(filenames)} file(s)."
    else:
        status = False
        message = f"Upload Failed: {len(filenames)} file(s) failed to upload."

    return JSONResponse(
        {
            "status": status,
            "message": message,
            "uploaded_files": filenames,
            "failed_files": failed_files,
        },
        status_code=200,
    )
