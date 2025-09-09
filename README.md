import msgpack

decoded = []
for indi in data:
    obj = msgpack.unpackb(indi["value"])
    decoded.append(obj)

def get_text_content(item):
    """Extract clean text if possible."""
    if isinstance(item, dict) and "content" in item:
        return item["content"]
    return None  # ignore ExtType etc.

questions_answers = []

for i in range(len(decoded)):
    item = decoded[i]
    if isinstance(item, dict) and item.get("role") == "user":
        # look for next user question
        for j in range(i+1, len(decoded)):
            nxt = decoded[j]
            if isinstance(nxt, dict) and nxt.get("role") == "user":
                # answer is 2 steps before next user question
                if j-2 >= 0:
                    answer = get_text_content(decoded[j-2])
                    if answer:  # only if we found real text
                        questions_answers.append({
                            "question": item["content"],
                            "answer": answer
                        })
                break

# Print clean pairs
for qa in questions_answers:
    print("Q:", qa["question"])
    print("A:", qa["answer"])
    print("-" * 40)
