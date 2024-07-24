import os

def read_request_count(file_path='request_count.txt'):
    if not os.path.exists(file_path):
        with open(file_path, 'w') as file:
            file.write('0')
    with open(file_path, 'r') as file:
        count = int(file.read().strip())
    return count

def write_request_count(count, file_path='request_count.txt'):
    with open(file_path, 'w') as file:
        file.write(str(count))

def increment_request_count(file_path='request_count.txt'):
    count = read_request_count(file_path)
    count += 1
    write_request_count(count, file_path)
    return count
