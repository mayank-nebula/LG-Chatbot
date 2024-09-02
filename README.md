def load_large_file_into_shared_memory():
    global shm
    with shm_lock:
        try:
            # Try to attach to existing shared memory
            shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
            print(f"Attached to existing shared memory: {SHM_NAME}.")
        except FileNotFoundError:
            # FileNotFoundError means shared memory does not exist
            print(f"Shared memory {SHM_NAME} does not exist. Creating and loading it...")
            with open(os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"), "rb") as f:
                data = f.read()

            total_size = len(data)
            # Create new shared memory and load data
            shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=total_size)
            shm.buf[:total_size] = data
            print(f"Loaded pkl file to shared memory: {SHM_NAME}.")
        return shm
