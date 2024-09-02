def load_large_file_into_shared_memory():
    with shm_lock:
        shm = None
        max_retries = 5
        retries = 0

        while retries < max_retries:
            try:
                shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
                print(f"Attached to existing shared memory: {SHM_NAME}.")
                break
            except FileNotFoundError:
                if retries == 0:  # Only the first attempt to load the data from file
                    with open(
                        os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"),
                        "rb",
                    ) as f:
                        data = f.read()
                try:
                    shm = shared_memory.SharedMemory(
                        name=SHM_NAME, create=True, size=len(data)
                    )
                    shm.buf[: len(data)] = data
                    print(f"Loaded pkl file to shared memory: {SHM_NAME}.")
                    break
                except FileExistsError:
                    print(f"Shared memory already exists, retrying... ({retries + 1})")
                    time.sleep(0.1)  # Short delay before retrying
                    retries += 1

        if shm is None:
            raise RuntimeError(f"Failed to attach to shared memory after {max_retries} retries.")

        return shm
