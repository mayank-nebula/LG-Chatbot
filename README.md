import requests
import json

# Replace with your WordPress site URL
WP_SITE = "https://letstalksupplychain.com"


def fetch_wp_categories():
    url = f"{WP_SITE}/wp-json/wp/v2/categories?per_page=100"
    response = requests.get(url)

    if response.status_code != 200:
        print("Error fetching categories:", response.status_code, response.text)
        return

    categories_raw = response.json()
    categories = []

    for cat in categories_raw:
        item = {
            "id": cat.get("id"),
            "name": cat.get("name"),
            "slug": cat.get("slug"),
        }

        categories.append(item)

    # Save to JSON file
    with open("categories.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, indent=4, ensure_ascii=False)

    print("Saved categories to categories.json")


if __name__ == "__main__":
    fetch_wp_categories()
