    yield f"data: {json.dumps({'type': 'chat_info', 'data': {'id': str(id), 'sources': sources}})}\n\n"
