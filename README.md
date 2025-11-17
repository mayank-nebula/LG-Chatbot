import requests

BASE_URL = "https://letstalksupplychain.com/wp-json/wp/v2/categories"
PARAMS = {
    "orderby": "count",
    "order": "desc",
    "per_page": 100,  # max allowed
}

def fetch_all_categories():
    page = 1
    all_categories = []

    while True:
        # print(f"Fetching page {page}...")
        
        resp = requests.get(BASE_URL, params={**PARAMS, "page": page})
        
        if resp.status_code == 400:
            # No more pages
            break

        resp.raise_for_status()
        data = resp.json()
        all_categories.extend(data)

        total_pages = int(resp.headers.get("X-WP-TotalPages", 1))

        if page >= total_pages:
            break
        
        page += 1

    return all_categories


if __name__ == "__main__":
    categories = fetch_all_categories()
    # print(f"Total categories fetched: {len(categories)}")

    # Example: print category name and count
    for cat in categories:
        print(f"{cat['name']}: {cat['count']}")
