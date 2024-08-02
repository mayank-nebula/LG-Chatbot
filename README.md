slide_number = doc.metadata.get("slide_number", "")

existing_key = next(
    (k for k in sources.keys() if k.startswith(title)), None
)

if existing_key:
    new_key = existing_key + (f", {slide_number}" if slide_number else "")
    sources[new_key] = sources.pop(existing_key)
else:
    new_key = f"{title}" + (f" - {slide_number}" if slide_number else "")
    sources[new_key] = link
