names = re.findall(r'([\w\s]+)\s*<', data['to'])

# Extracting emails
emails = re.findall(r'<([^>]+)>', data['to'])
