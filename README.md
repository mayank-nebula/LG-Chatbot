import json
import requests

WP_SITE = "https://letstalksupplychain.com"
REQUIRED_CATEGORIES = [8315, 8424]   # required categories (must match ALL)

def fetch_all_posts_for_category(cat_id, per_page=100):
    """Fetch all posts for a single category, across all pages."""
    page = 1
    all_posts = []

    while True:
        url = f"{WP_SITE}/wp-json/wp/v2/posts?categories={cat_id}&per_page={per_page}&page={page}"
        r = requests.get(url)

        if r.status_code == 400: 
            # Reached beyond available pages
            break

        if r.status_code != 200:
            print("Error:", r.status_code, r.text)
            break

        posts = r.json()
        if not posts:
            break

        all_posts.extend(posts)
        page += 1

    return all_posts


def fetch_posts_matching_all_categories():
    # Step 1: Fetch all posts for the *first* category
    base_cat = REQUIRED_CATEGORIES[0]
    base_posts = fetch_all_posts_for_category(base_cat)

    # Step 2: Filter posts that contain ALL categories
    filtered = []
    for post in base_posts:
        post_cats = post.get("categories", [])
        if all(cat in post_cats for cat in REQUIRED_CATEGORIES):
            filtered.append(post)

    return filtered


if __name__ == "__main__":
    posts = fetch_posts_matching_all_categories()
    posts_append = []

    print(f"Total posts matching ALL categories {REQUIRED_CATEGORIES}: {len(posts)}")
    for p in posts:
        posts_append.append({
            "id":p['id'],
            "slug":p['slug'],
            "title":p['title']['rendered'],
            "content":p['content']['rendered'],
            "excerpt":p['excerpt']['rendered'],
        })

    with open("posts.json", "w", encoding="utf-8") as f:
        json.dump(posts_append, f, ensure_ascii=False, indent=4)
