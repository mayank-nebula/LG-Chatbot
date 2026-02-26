import json
import re
from bs4 import BeautifulSoup


def clean_ld_json(raw: str) -> str:
    """Fix common escape issues in ld+json blocks."""

    # Replace invalid \' with just '  (most common culprit)
    raw = raw.replace("\\'", "'")

    # Replace invalid \& with &
    raw = raw.replace("\\&", "&")

    # Remove any other invalid single-char escapes not allowed in JSON
    # Valid JSON escapes: \" \\ \/ \b \f \n \r \t \uXXXX
    raw = re.sub(r"\\([^\"\\/bfnrtu])", r"\1", raw)

    return raw


def extract_ld_json(html: str) -> list[dict]:
    """
    Safely extract and parse all application/ld+json script tags from HTML.
    Handles invalid escape sequences gracefully.
    """
    results = []

    try:
        soup = BeautifulSoup(html, "html.parser")
        scripts = soup.find_all("script", type="application/ld+json")

        for script in scripts:
            if not script.string:
                continue

            raw = script.string

            # First attempt: parse as-is
            try:
                results.append(json.loads(raw))
                continue
            except json.JSONDecodeError:
                pass

            # Second attempt: clean invalid escapes then retry
            try:
                cleaned = clean_ld_json(raw)
                results.append(json.loads(cleaned))
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse ld+json block after cleaning: {e}")

    except Exception as e:
        print(f"Error parsing HTML: {e}")

    return results


# -----------------------------
# Example Usage
# -----------------------------
if __name__ == "__main__":

    html_string = """<title>Podcast &bull; Let’s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News</title>\n<meta name=\"description\" content=\"Hi! I’m Sarah Barnes-Humphrey, and supply chain is in my blood. Growing up in a family of logistics entrepreneurs, I played with trucks not Barbies and our\"/>\n<meta name=\"robots\" content=\"follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large\"/>\n<link rel=\"canonical\" href=\"https://letstalksupplychain.com/podcast/\" />\n<meta property=\"og:locale\" content=\"en_US\" />\n<meta property=\"og:type\" content=\"article\" />\n<meta property=\"og:title\" content=\"Podcast &bull; Let’s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News\" />\n<meta property=\"og:description\" content=\"Hi! I’m Sarah Barnes-Humphrey, and supply chain is in my blood. Growing up in a family of logistics entrepreneurs, I played with trucks not Barbies and our\" />\n<meta property=\"og:url\" content=\"https://letstalksupplychain.com/podcast/\" />\n<meta property=\"og:site_name\" content=\"Let&#039;s Talk Supply Chain\" />\n<meta property=\"article:publisher\" content=\"https://web.facebook.com/letstalksupplychain/\" />\n<meta property=\"og:updated_time\" content=\"2025-03-21T00:12:29+05:30\" />\n<meta property=\"og:image\" content=\"https://letstalksupplychain.com/wp-content/uploads/2023/03/LTSC-socialshare-1200x630-1.jpg\" />\n<meta property=\"og:image:secure_url\" content=\"https://letstalksupplychain.com/wp-content/uploads/2023/03/LTSC-socialshare-1200x630-1.jpg\" />\n<meta property=\"og:image:width\" content=\"1200\" />\n<meta property=\"og:image:height\" content=\"630\" />\n<meta property=\"og:image:alt\" content=\"Podcast\" />\n<meta property=\"og:image:type\" content=\"image/jpeg\" />\n<meta property=\"article:published_time\" content=\"2021-09-30T12:36:03+05:30\" />\n<meta property=\"article:modified_time\" content=\"2025-03-21T00:12:29+05:30\" />\n<meta name=\"twitter:card\" content=\"summary_large_image\" />\n<meta name=\"twitter:title\" content=\"Podcast &bull; Let’s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News\" />\n<meta name=\"twitter:description\" content=\"Hi! I’m Sarah Barnes-Humphrey, and supply chain is in my blood. Growing up in a family of logistics entrepreneurs, I played with trucks not Barbies and our\" />\n<meta name=\"twitter:site\" content=\"@LetsTalkSChain\" />\n<meta name=\"twitter:creator\" content=\"@LetsTalkSChain\" />\n<meta name=\"twitter:image\" content=\"https://letstalksupplychain.com/wp-content/uploads/2023/03/LTSC-socialshare-1200x630-1.jpg\" />\n<meta name=\"twitter:label1\" content=\"Time to read\" />\n<meta name=\"twitter:data1\" content=\"1 minute\" />\n<script type=\"application/ld+json\" class=\"rank-math-schema-pro\">{\"@context\":\"https://schema.org\",\"@graph\":[{\"@type\":\"Organization\",\"@id\":\"https://letstalksupplychain.com/#organization\",\"name\":\"Lets Talk Supply Chain\",\"sameAs\":[\"https://web.facebook.com/letstalksupplychain/\",\"https://twitter.com/LetsTalkSChain\"],\"logo\":{\"@type\":\"ImageObject\",\"@id\":\"https://letstalksupplychain.com/#logo\",\"url\":\"https://letstalksupplychain.com/wp-content/uploads/2021/10/LTSC-favicon-500x500-1.jpg\",\"contentUrl\":\"https://letstalksupplychain.com/wp-content/uploads/2021/10/LTSC-favicon-500x500-1.jpg\",\"caption\":\"Let's Talk Supply Chain\",\"inLanguage\":\"en-US\",\"width\":\"500\",\"height\":\"500\"}},{\"@type\":\"WebSite\",\"@id\":\"https://letstalksupplychain.com/#website\",\"url\":\"https://letstalksupplychain.com\",\"name\":\"Let's Talk Supply Chain\",\"publisher\":{\"@id\":\"https://letstalksupplychain.com/#organization\"},\"inLanguage\":\"en-US\"},{\"@type\":\"ImageObject\",\"@id\":\"https://letstalksupplychain.com/wp-content/uploads/2025/01/Diseno-sin-titulo-6-1.png\",\"url\":\"https://letstalksupplychain.com/wp-content/uploads/2025/01/Diseno-sin-titulo-6-1.png\",\"width\":\"741\",\"height\":\"659\",\"inLanguage\":\"en-US\"},{\"@type\":\"BreadcrumbList\",\"@id\":\"https://letstalksupplychain.com/podcast/#breadcrumb\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":\"1\",\"item\":{\"@id\":\"https://letstalksupplychain.com\",\"name\":\"Home\"}},{\"@type\":\"ListItem\",\"position\":\"2\",\"item\":{\"@id\":\"https://letstalksupplychain.com/podcast/\",\"name\":\"Podcast\"}}]},{\"@type\":\"WebPage\",\"@id\":\"https://letstalksupplychain.com/podcast/#webpage\",\"url\":\"https://letstalksupplychain.com/podcast/\",\"name\":\"Podcast &bull; Let\’s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News\",\"datePublished\":\"2021-09-30T12:36:03+05:30\",\"dateModified\":\"2025-03-21T00:12:29+05:30\",\"isPartOf\":{\"@id\":\"https://letstalksupplychain.com/#website\"},\"primaryImageOfPage\":{\"@id\":\"https://letstalksupplychain.com/wp-content/uploads/2025/01/Diseno-sin-titulo-6-1.png\"},\"inLanguage\":\"en-US\",\"breadcrumb\":{\"@id\":\"https://letstalksupplychain.com/podcast/#breadcrumb\"}},{\"@type\":\"Person\",\"@id\":\"https://letstalksupplychain.com/podcast/#author\",\"name\":\"aline.nicoleli@gmail.com\",\"image\":{\"@type\":\"ImageObject\",\"@id\":\"https://secure.gravatar.com/avatar/49c50faf30c4cde68a249c26067abae2315dca9b17d2128db168225a90244b2c?s=96&amp;d=mm&amp;r=g\",\"url\":\"https://secure.gravatar.com/avatar/49c50faf30c4cde68a249c26067abae2315dca9b17d2128db168225a90244b2c?s=96&amp;d=mm&amp;r=g\",\"caption\":\"aline.nicoleli@gmail.com\",\"inLanguage\":\"en-US\"},\"worksFor\":{\"@id\":\"https://letstalksupplychain.com/#organization\"}},{\"headline\":\"Podcast &bull; Let\’s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News\",\"description\":\"Hi! I\’m Sarah Barnes-Humphrey, and supply chain is in my blood. Growing up in a family of logistics entrepreneurs, I played with trucks not Barbies and our\",\"datePublished\":\"2021-09-30T12:36:03+05:30\",\"dateModified\":\"2025-03-21T00:12:29+05:30\",\"image\":{\"@id\":\"https://letstalksupplychain.com/wp-content/uploads/2025/01/Diseno-sin-titulo-6-1.png\"},\"author\":{\"@id\":\"https://letstalksupplychain.com/podcast/#author\",\"name\":\"aline.nicoleli@gmail.com\"},\"@type\":\"Article\",\"name\":\"Podcast &bull; Let\’s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News\",\"@id\":\"https://letstalksupplychain.com/podcast/#schema-238429\",\"isPartOf\":{\"@id\":\"https://letstalksupplychain.com/podcast/#webpage\"},\"publisher\":{\"@id\":\"https://letstalksupplychain.com/#organization\"},\"inLanguage\":\"en-US\",\"mainEntityOfPage\":{\"@id\":\"https://letstalksupplychain.com/podcast/#webpage\"}}]}</script>\n"""
    ld_json_data = extract_ld_json(html_string)

    for i, item in enumerate(ld_json_data):
        print(f"\n--- Block {i + 1} ---")
        print(json.dumps(item, indent=2))
