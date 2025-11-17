skip_sql = False
awaiting_sql = False
buffered_fence = ""

ignore_name_block = False
name_buffer = ""
first_token_seen = False

async for event in app.astream_events(input, config):
    kind = event["event"]
    checkpoint_ns = event.get("metadata", {}).get("langgraph_checkpoint_ns")

    if kind == "on_chat_model_stream" and "supervisor" in checkpoint_ns:
        token = event["data"]["chunk"].content
        stripped = token.strip().lower()

        # ============================================
        #   NEW LOGIC: IGNORE INITIAL {"name": ... }
        # ============================================
        if not first_token_seen:
            if token.strip():  # first non-empty chunk(s)
                name_buffer += token

                # normalized partial match buffer
                partial = name_buffer.replace("\n", "").strip()
                expected = '{"name":'

                # if partial matches the expected prefix
                if expected.startswith(partial):
                    ignore_name_block = True

                # while ignoring, stop only when a newline appears
                if ignore_name_block:
                    if "\n" in token:
                        ignore_name_block = False
                        first_token_seen = True
                    continue  # skip this token entirely

                # does not look like a {"name": prefix → proceed normally
                first_token_seen = True

        # still ignoring name block outside the first stage
        if ignore_name_block:
            continue
        # ============================================
        #   END NEW LOGIC
        # ============================================

        # --------------------------------------------
        # EXISTING SQL-SKIP LOGIC (UNTOUCHED)
        # --------------------------------------------

        if awaiting_sql:
            awaiting_sql = False

            if stripped.startswith("sql"):
                skip_sql = True
                buffered_fence = ""
                continue
            else:
                if buffered_fence:
                    final_response += buffered_fence
                    yield json.dumps(
                        {"type": "text", "content": buffered_fence}
                    )
                    buffered_fence = ""

        if not skip_sql and "```sql" in token:
            skip_sql = True
            continue

        if not skip_sql and stripped == "```":
            awaiting_sql = True
            buffered_fence = token
            continue

        if skip_sql and "```" in token:
            skip_sql = False
            continue

        if not skip_sql:
            final_response += token
            yield json.dumps({"type": "text", "content": token})
