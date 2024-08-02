slide_number = doc.metadata["slide_number"] if doc.metadata["slide_number"] else ""

                existing_key = next(
                    (k for k in sources.keys() if k.startswith(title)), None
                )

                if existing_key:
                    new_key = existing_key + f", {slide_number}"
                    sources[new_key] = sources.pop(existing_key)
                else:
                    new_key = f"{title} - {slide_number}"
                    sources[new_key] = link
