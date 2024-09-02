def load_large_file_into_shared_memory():
    """Loads a large pickle file into shared memory."""
    with open(os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"), "rb") as f:
        data = f.read()
        shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=len(data))
        shm.buf[:len(data)] = data  # Copy the data into shared memory
    return shm

def load_shared_memory_into_object():
    """Loads the shared memory data back into a Python object."""
    shm = shared_memory.SharedMemory(name=SHM_NAME)
    buffer = shm.buf[:]
    return pickle.loads(buffer)

# Load the file into shared memory
shm = load_large_file_into_shared_memory()
