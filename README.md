import os
import requests
from urllib.parse import urlparse

# 🔧 CONFIGURATION
BASE_URL = "https://your-site.com/wp-json/wp/v2/media"
DOWNLOAD_DIR = "downloads"
AUTH = None  # Example: ("username", "password") if authentication is needed

# Create download directory if not exists
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

page = 1
downloaded = 0

print("🔍 Fetching media list from WordPress...")

while True:
    # Fetch a page of media
    response = requests.get(BASE_URL, params={"per_page": 100, "page": page}, auth=AUTH)
    
    if response.status_code == 400:
        # No more pages
        break
    response.raise_for_status()

    media_items = response.json()
    if not media_items:
        break

    for media in media_items:
        url = media.get("source_url")
        if not url:
            continue

        filename = os.path.basename(urlparse(url).path)
        filepath = os.path.join(DOWNLOAD_DIR, filename)

        # Skip if already downloaded
        if os.path.exists(filepath):
            continue

        print(f"⬇️  Downloading: {filename}")
        file_response = requests.get(url, stream=True)
        if file_response.status_code == 200:
            with open(filepath, "wb") as f:
                for chunk in file_response.iter_content(chunk_size=8192):
                    f.write(chunk)
            downloaded += 1

    page += 1

print(f"\n✅ Done! Downloaded {downloaded} files to '{DOWNLOAD_DIR}' folder.")
