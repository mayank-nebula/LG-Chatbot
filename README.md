for line in response.iter_lines():
            if line:
                # Split concatenated JSON objects
                line_str = line.decode('utf-8')
                json_objects = line_str.replace('}{', '}\n{').splitlines()

                # Process each JSON object individually
                for obj in json_objects:
                    try:
                        line_data = json.loads(obj)
                        # Accumulate only if the type is "text"
                        if line_data.get("type") == "text":
                            accumulated_answer += line_data.get("content", "")
                        # Stop if "sources" type is reached
                        elif line_data.get("type") == "sources":
                            return accumulated_answer
                    except json.JSONDecodeError as e:
                        print(f"JSON decoding error: {e}")
                        continue
    return accumulated_answer
