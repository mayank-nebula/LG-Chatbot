import json
import copy
import time
import google.generativeai as genai

genai.configure(api_key=GOOGLE_API_KEY)

TITLE_CHAR_LIMIT = 50
BLURB_CHAR_LIMIT = 165
MODEL_NAME = "gemini-2.0-flash"  # update to your valid model

# ── helpers ──────────────────────────────────────────────────────────────────

def build_title_prompt(title: str) -> str:
    return (
        f"Rewrite the following title to be less than {TITLE_CHAR_LIMIT} characters "
        f"while maintaining its original meaning. Return ONLY the new title text.\n"
        f"Title: {title}"
    )

def build_blurb_prompt(content: str) -> str:
    return (
        f"Summarize the following content to be less than {BLURB_CHAR_LIMIT} characters "
        f"while maintaining the core meaning. Return ONLY the summarized text.\n"
        f"Content: {content}"
    )

def call_gemini(prompt: str, model) -> str:
    response = model.generate_content(prompt)
    return response.text.strip()

# ── batch processor ───────────────────────────────────────────────────────────

def process_json_file(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    model = genai.GenerativeModel(MODEL_NAME)

    # ── Phase 1: collect all prompts and track what each item needs ──
    # Each entry in `tasks` maps to one item in `data`:
    # {
    #   "item_index": int,
    #   "needs_title": bool,   # True  → title prompt is queued
    #   "needs_blurb": bool,   # always True
    #   "title_prompt_index": int | None,
    #   "blurb_prompt_index": int,
    # }
    prompts: list[str] = []
    tasks: list[dict] = []

    for idx, item in enumerate(data):
        original_title = item.get("title", "")
        original_content = item.get("content", "")

        task = {"item_index": idx, "original_title": original_title}

        if len(original_title) > TITLE_CHAR_LIMIT:
            task["needs_title"] = True
            task["title_prompt_index"] = len(prompts)
            prompts.append(build_title_prompt(original_title))
        else:
            task["needs_title"] = False
            task["title_prompt_index"] = None

        task["blurb_prompt_index"] = len(prompts)
        prompts.append(build_blurb_prompt(original_content))

        tasks.append(task)

    print(f"Sending {len(prompts)} prompts to Gemini for {len(data)} items...")

    # ── Phase 2: fire all prompts concurrently using send_message_batch ──
    # GenerativeModel.generate_content_async batch via ThreadPoolExecutor
    from concurrent.futures import ThreadPoolExecutor, as_completed

    responses: list[str | None] = [None] * len(prompts)

    def fetch(index_prompt):
        index, prompt = index_prompt
        try:
            return index, call_gemini(prompt, model)
        except Exception as e:
            print(f"  ✗ Prompt {index} failed: {e}")
            return index, ""

    # 10 workers — tune based on your quota (QPM / 60 * latency)
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch, (i, p)): i for i, p in enumerate(prompts)}
        completed = 0
        for future in as_completed(futures):
            idx_result, text = future.result()
            responses[idx_result] = text
            completed += 1
            if completed % 10 == 0 or completed == len(prompts):
                print(f"  ✓ {completed}/{len(prompts)} prompts done")

    # ── Phase 3: assemble output ──────────────────────────────────────────────
    results = []
    for task in tasks:
        item = data[task["item_index"]]
        updated_item = copy.deepcopy(item)

        if task["needs_title"]:
            updated_item["short_title"] = responses[task["title_prompt_index"]] or item.get("title", "")
        else:
            updated_item["short_title"] = task["original_title"]

        updated_item["blurb"] = responses[task["blurb_prompt_index"]] or ""
        results.append(updated_item)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nDone. Output written to {output_path}")


if __name__ == "__main__":
    process_json_file("data.json", "output.json")
