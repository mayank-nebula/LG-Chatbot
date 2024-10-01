pattern = r'([\w\s]+)\s*<([^>]+)>'

matches = re.findall(pattern, data['to'])

# Separating names and emails
names = [match[0].strip() for match in matches]
emails = [match[1].strip() for match in matches]
