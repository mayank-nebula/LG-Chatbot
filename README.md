ERROR:    Traceback (most recent call last):
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/starlette/routing.py", line 732, in lifespan
    async with self.lifespan_context(app) as maybe_state:
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/starlette/routing.py", line 608, in __aenter__
    await self._router.startup()
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/starlette/routing.py", line 711, in startup
    handler()
  File "/home/Mayank.Sharma/GV_Test/backend/fast/main_v2.py", line 623, in startup_event
    loaded_docstore_gpt = load_shared_memory_into_object()
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/GV_Test/backend/fast/main_v2.py", line 72, in load_shared_memory_into_object
    return pickle.loads(buffer)
           ^^^^^^^^^^^^^^^^^^^^
_pickle.UnpicklingError: invalid load key, '\x00'.
