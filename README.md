import json
import re
import requests
from pathlib import Path

# =========================
# CONFIG
# =========================

HTML_JSON_FILE = "html_structure.json"
PAGE_ID = 23319  # Elementor page ID
SITE_URL = "https://letstalksupplychain.com"

CSS_URL = f"{SITE_URL}/wp-content/uploads/elementor/css/post-{PAGE_ID}.css"
OUTPUT_FILE = "front_banners.json"

# =========================
# LOAD HTML STRUCTURE
# =========================

with open(HTML_JSON_FILE, "r", encoding="utf-8") as f:
    html_data = json.load(f)

# =========================
# FIND SLIDES WIDGETS
# =========================


def find_sliders(nodes):
    sliders = []

    for node in nodes:
        if node.get("properties", {}).get("data-widget_type") == "slides.default":
            sliders.append(node)

        sliders.extend(find_sliders(node.get("children", [])))

    return sliders


# =========================
# EXTRACT SLIDES (REPEATER IDS + LINKS)
# =========================


def extract_slides(slider_node):
    slides = []

    def walk(node):
        classes = node.get("properties", {}).get("class", [])

        if isinstance(classes, list):
            repeater = next(
                (c for c in classes if c.startswith("elementor-repeater-item-")), None
            )

            if repeater:
                slide = {
                    "repeater_id": repeater,
                    "link": None,
                    "aria_label": None,
                }

                for child in node.get("children", []):
                    if child.get("tag") == "div":
                        slide["aria_label"] = child.get("properties", {}).get(
                            "aria-label"
                        )

                    if child.get("tag") == "a":
                        slide["link"] = child.get("properties", {}).get("href")

                slides.append(slide)

        for child in node.get("children", []):
            walk(child)

    walk(slider_node)
    return slides


# =========================
# DOWNLOAD ELEMENTOR CSS
# =========================

print(f"Fetching Elementor CSS: {CSS_URL}")
css_response = requests.get(CSS_URL, timeout=15)
css_response.raise_for_status()
css_text = css_response.text

# =========================
# EXTRACT BACKGROUND IMAGES FROM CSS
# =========================


def extract_background_images(css_text):
    """
    Returns dict:
    {
      'elementor-repeater-item-xxxx': 'https://...jpg'
    }
    """
    pattern = re.compile(
        r"\.(elementor-repeater-item-[a-zA-Z0-9]+)[^{]*\{[^}]*background-image\s*:\s*url\((['\"]?)(.*?)\2\)",
        re.S,
    )

    images = {}
    for match in pattern.findall(css_text):
        repeater_id, _, url = match
        images[repeater_id] = url

    return images


background_images = extract_background_images(css_text)

# =========================
# BUILD FINAL BANNER DATA
# =========================

sliders = find_sliders(html_data)
banners = []

for slider in sliders:
    slides = extract_slides(slider)

    for slide in slides:
        repeater_id = slide["repeater_id"]
        banners.append(
            {
                "repeater_id": repeater_id,
                "image": background_images.get(repeater_id),
                "link": slide["link"],
                "aria_label": slide["aria_label"],
            }
        )

# =========================
# SAVE OUTPUT
# =========================

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(banners, f, indent=2, ensure_ascii=False)

print(f"\n✅ Extracted {len(banners)} banners")
print(f"📁 Saved to {OUTPUT_FILE}")
