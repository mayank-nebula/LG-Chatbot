import re

data = {
    'to': 'Mayank Sharma <mayank@gamil.com>; Divyam Jain <divyam@gmail.com>'
}

# Extracting names
names = re.findall(r'([\w\s]+)\s*<', data['to'])

# Extracting emails
emails = re.findall(r'<([^>]+)>', data['to'])

print("Names:", names)
print("Emails:", emails)
