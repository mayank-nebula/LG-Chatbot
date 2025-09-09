import msgpack

decoded = []
for indi in data:
    obj = msgpack.unpackb(indi["value"])
    decoded.append(obj)

def extract_dicts(item):
    """Recursively extract dicts with role/content from nested structures."""
    results = []
    if isinstance(item, dict):
        results.append(item)
    elif isinstance(item, list):
        for sub in item:
            results.extend(extract_dicts(sub))
    # ignore ExtType and other raw stuff
    return results

# flatten everything into list of dicts
all_dicts = []
for item in decoded:
    all_dicts.extend(extract_dicts(item))

# now find Q → A pairs
qa_pairs = []
for i in range(len(all_dicts)):
    d = all_dicts[i]
    if d.get("role") == "user":
        # find next user question
        for j in range(i+1, len(all_dicts)):
            if all_dicts[j].get("role") == "user":
                # answer is 2 before next question
                if j-2 >= 0 and "content" in all_dicts[j-2]:
                    qa_pairs.append({
                        "question": d["content"],
                        "answer": all_dicts[j-2]["content"]
                    })
                break

# print clean
for qa in qa_pairs:
    print("Q:", qa["question"])
    print("A:", qa["answer"])
    print("-" * 40)
