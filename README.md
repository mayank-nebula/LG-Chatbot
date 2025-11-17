skip_sql = False
            awaiting_sql = False
            buffered_fence = ""

            async for event in app.astream_events(input, config):
                kind = event["event"]
                checkpoint_ns = event.get("metadata", {}).get("langgraph_checkpoint_ns")
                if kind == "on_chat_model_stream" and "supervisor" in checkpoint_ns:
                    token = event["data"]["chunk"].content
                    stripped = token.strip().lower()

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
                        # logger.info(event)
                        yield json.dumps({"type": "text", "content": token})
