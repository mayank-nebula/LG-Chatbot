all_items = []
continuation_token = None

while True:
    params = {}
    if continuation_token:
        params["continuationToken"] = continuation_token

    resp = requests.get(BASE_URL, headers=headers, params=params)

    if not resp.ok:
        raise RuntimeError(f"Error {resp.status_code}: {resp.text}")

    data = resp.json()
    all_items.extend(data.get("items", []))

    continuation_token = resp.headers.get("X-Continuation-Token")
    if not continuation_token:  # no more pages
        break
