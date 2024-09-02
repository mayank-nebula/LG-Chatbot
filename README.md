Exception ignored in: <function SharedMemory.__del__ at 0x7effab256e80>
Traceback (most recent call last):
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/multiprocessing/shared_memory.py", line 187, in __del__
    self.close()
  File "/home/Mayank.Sharma/anaconda3/envs/GV_Test/lib/python3.11/multiprocessing/shared_memory.py", line 230, in close
    self._mmap.close()
BufferError: cannot close exported pointers exist
