import sys
from multiprocessing import shared_memory

# Names of the shared memory blocks to clean up
SHM_NAME_GPT = "docstore_shared_memory_gpt"
SHM_NAME_GPT_SUMMARY = "docstore_shared_memory_gpt_summary"

def cleanup_shared_memory(shm_name):
    """Cleanup the shared memory object."""
    try:
        shm = shared_memory.SharedMemory(name=shm_name, create=False)
        shm.close()
        shm.unlink()
        print(f"Successfully cleaned up shared memory: {shm_name}")
    except FileNotFoundError:
        print(f"No shared memory block found with name: {shm_name}")
    except Exception as e:
        print(f"Error cleaning up shared memory {shm_name}: {e}")

if __name__ == "__main__":
    cleanup_shared_memory(SHM_NAME_GPT)
    cleanup_shared_memory(SHM_NAME_GPT_SUMMARY)
