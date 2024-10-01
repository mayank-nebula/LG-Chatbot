# Extracting names (handling extra whitespaces including tabs and spaces)
names = re.findall(r'([^\t<]+?)\s*<', data['to'])

# Extracting emails
emails = re.findall(r'<\s*([^>]+)\s*>', data['to'])
