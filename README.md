import json
import copy


def mock_gemini_call(title: str | None, content: str | None) -> dict:
    """
    Mock Gemini call.
    - If title is provided → return optimized <= 50 char title
    - If content is provided → return <= 165 char summary
    """

    result = {}

    if title is not None:
        # Pretend LLM rewrote it intelligently
        result["short_title"] = title[:50]

    if content is not None:
        # Pretend LLM summarized it intelligently
        result["blurb"] = content[:165]

    return result


def process_json_file(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = []

    for item in data:
        # Copy full original object
        updated_item = copy.deepcopy(item)

        original_title = item.get("title", "")
        original_content = item.get("content", "")

        # --- TITLE LOGIC ---
        if len(original_title) > 50:
            response = mock_gemini_call(
                title=original_title,
                content=original_content
            )
            updated_item["short_title"] = response["short_title"]
            updated_item["blurb"] = response["blurb"]
        else:
            # Title is fine → keep original as short_title
            updated_item["short_title"] = original_title

            response = mock_gemini_call(
                title=None,
                content=original_content
            )
            updated_item["blurb"] = response["blurb"]

        results.append(updated_item)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    process_json_file("data.json", "output.json")
