async for event in app.astream_events(input, config):
    kind = event["event"]
    checkpoint_ns = event.get("metadata", {}).get("langgraph_checkpoint_ns")

    if kind == "on_chat_model_stream" and "supervisor" in checkpoint_ns:
        token = event["data"]["chunk"].content
        stripped = token.strip().lower()

        # ==================================================
        #       NEW LOGIC — INITIAL NAME-BLOCK DETECTION
        # ==================================================

        if deciding_name_block:

            # Skip empty tokens before we see first meaningful content
            if not token.strip():
                continue

            # Accumulate into buffer
            name_buffer += token

            # --- Case A: Found {\"name\": before newline → IGNORE MODE ---
            if EXPECTED in name_buffer and "\n" not in name_buffer:
                ignoring_name_block = True
                deciding_name_block = False
                continue

            # --- Case B: newline arrived BEFORE detecting {\"name\": → FLUSH ---
            if "\n" in name_buffer and EXPECTED not in name_buffer:
                deciding_name_block = False  # decision made
                final_response += name_buffer
                yield json.dumps({"type": "text", "content": name_buffer})
                name_buffer = ""
                continue

            # --- Case C: We haven't matched enough to decide yet ---
            continue  # keep accumulating

        # After decision is made:
        if ignoring_name_block:
            # stop ignoring once newline appears
            if "\n" in token:
                ignoring_name_block = False
            continue  # skip until newline
