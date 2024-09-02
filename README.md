def load_file_into_shared_memory(file_path, shm_name, shm_size):
    """Loads a large pickle file into shared memory, only if it's not already loaded."""
    try:
        # Attempt to attach to the existing shared memory block
        shm = shared_memory.SharedMemory(name=shm_name, create=False)
        print(f"Attached to existing shared memory: {shm_name}.")
    except FileNotFoundError:
        # Shared memory block doesn't exist, so load the file and create the block
        with open(file_path, "rb") as f:
            data = f.read()
            shm = shared_memory.SharedMemory(name=shm_name, create=True, size=len(data))
            shm.buf[:len(data)] = data  # Copy the data into shared memory
            print(f"Loaded pickle file {file_path} into shared memory: {shm_name}.")
    return shm
