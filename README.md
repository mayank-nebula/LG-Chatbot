During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/multiprocessing/process.py", line 314, in _bootstrap
    self.run()
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/multiprocessing/process.py", line 108, in run
    self._target(*self._args, **self._kwargs)
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/_subprocess.py", line 80, in subprocess_started
    target(sockets=sockets)
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/supervisors/multiprocess.py", line 63, in target
    return self.real_target(sockets)
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/server.py", line 65, in run
    return asyncio.run(self.serve(sockets=sockets))
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/asyncio/runners.py", line 190, in run
    return runner.run(main)
           ^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/asyncio/runners.py", line 118, in run
    return self._loop.run_until_complete(task)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "uvloop/loop.pyx", line 1517, in uvloop.loop.Loop.run_until_complete
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/server.py", line 69, in serve
    await self._serve(sockets)
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/server.py", line 76, in _serve
    config.load()
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/config.py", line 434, in load
    self.loaded_app = import_from_string(self.app)
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/site-packages/uvicorn/importer.py", line 19, in import_from_string
    module = importlib.import_module(module_str)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/home/Mayank.Sharma/GV_Test/backend/fast/main_v2.py", line 69, in <module>
    shm = load_large_file_into_shared_memory()
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/GV_Test/backend/fast/main_v2.py", line 57, in load_large_file_into_shared_memory
    shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=len(data))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/multiprocessing/shared_memory.py", line 104, in __init__
    self._fd = _posixshmem.shm_open(
               ^^^^^^^^^^^^^^^^^^^^^
FileExistsError: [Errno 17] File exists: '/docstore_gpt_testing'
