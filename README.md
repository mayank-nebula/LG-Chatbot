SHM_NAME = "docstore_gpt_testing"
shm_lock = Lock()


def load_large_file_into_shared_memory():
    with shm_lock:
        try:
            shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
            print(f"Attached to existing shared memory: {SHM_NAME}.")
        except FileNotFoundError:
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
            except FileExistsError:
                shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
                print(f"Attached to newly created shared memory: {SHM_NAME}.")
        return shm


def load_shared_memory_into_object():
    shm = shared_memory.SharedMemory(name=SHM_NAME)
    buffer = bytes(shm.buf[: shm.size])
    return pickle.loads(buffer)


shm = load_large_file_into_shared_memory()


@app.on_event("startup")
def startup_event():
    with shm_lock:
        global loaded_docstore_gpt
        loaded_docstore_gpt = load_shared_memory_into_object()


@app.on_event("shutdown")
def shutdown_event():
    with shm_lock:
        global shm
        try:
            shm.close()
            shm.unlink()
        except BufferError as e:
            print(f"Error closing/unlinking shm : {e}")



ERROR:    Traceback (most recent call last):
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/starlette/routing.py", line 732, in lifespan
    async with self.lifespan_context(app) as maybe_state:
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/starlette/routing.py", line 608, in __aenter__
    await self._router.startup()
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/starlette/routing.py", line 711, in startup
    handler()
  File "/home/Mayank.Sharma/GV_Test/backend/fast/main_v2.py", line 624, in startup_event
    loaded_docstore_gpt = load_shared_memory_into_object()
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/GV_Test/backend/fast/main_v2.py", line 72, in load_shared_memory_into_object
    return pickle.loads(buffer)
           ^^^^^^^^^^^^^^^^^^^^
_pickle.UnpicklingError: invalid load key, '\x00'.
