def load_large_file_into_shared_memory():
    global shm
    with shm_lock:
        try:
            # Attempt to attach to existing shared memory
            shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
            print(f"Attached to existing shared memory: {SHM_NAME}.")
        except FileNotFoundError:
            # If not found, load the data and create shared memory
            with open(os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"), "rb") as f:
                data = f.read()

            total_size = len(data)
            try:
                # Create new shared memory and load the entire file into it
                shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=total_size)
                shm.buf[:total_size] = data
                print(f"Loaded pkl file to shared memory: {SHM_NAME}.")
            except FileExistsError:
                # If FileExistsError occurs, another worker already created the shared memory
                shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
                print(f"Attached to newly created shared memory: {SHM_NAME}.")
        return shm
