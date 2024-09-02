def load_large_file_into_shared_memory():
    global shm
    with shm_lock:
        try:
            # Attempt to attach to existing shared memory
            shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
            print(f"Attached to existing shared memory: {SHM_NAME}.")
            
            # Check if the memory is fully initialized by checking the sentinel
            if shm.buf[0] != 1:
                print("Shared memory not fully initialized. Waiting...")
                with condition:
                    # Wait for the initialization signal
                    condition.wait_for(lambda: shm.buf[0] == 1)

        except FileNotFoundError:
            # If not found, load the data and create shared memory
            with open(os.path.join(current_dir, "docstores", "GatesVentures_Scientia.pkl"), "rb") as f:
                data = f.read()

            total_size = len(data)
            try:
                # Create new shared memory and load the file in chunks
                shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=total_size + 1)
                for i in range(0, total_size, CHUNK_SIZE):
                    shm.buf[i:i+CHUNK_SIZE] = data[i:i+CHUNK_SIZE]
                    print(f"Loaded chunk {i // CHUNK_SIZE + 1} to shared memory: {SHM_NAME}.")

                # Set the sentinel value to indicate full initialization
                shm.buf[0] = 1
                print(f"Loaded pkl file to shared memory: {SHM_NAME}.")

                # Notify other workers that the memory is initialized
                with condition:
                    condition.notify_all()
                
            except FileExistsError:
                # If FileExistsError occurs, another worker already created the shared memory
                shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
                print(f"Attached to newly created shared memory: {SHM_NAME}.")
                
                # Wait until the sentinel value indicates completion
                with condition:
                    condition.wait_for(lambda: shm.buf[0] == 1)

        return shm
