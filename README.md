import requests
from langchain.tools import tool
from typing import List, Dict


WHO_PUBLICATIONS_URL = "https://www.who.int/api/multimedias/publications"


def fetch_who_publications(limit: int = 5) -> List[Dict]:
    """
    Fetch a list of WHO publications metadata (raw).
    """
    resp = requests.get(WHO_PUBLICATIONS_URL)
    resp.raise_for_status()
    data = resp.json()
    # The JSON is expected to be a list of items
    if isinstance(data, dict):
        # Sometimes it's wrapped in a key, adjust if needed
        # e.g. data.get("value")
        publications = data.get("value", [])
    else:
        publications = data
    return publications[:limit]


def filter_publications_by_query(
    pubs: List[Dict], query: str
) -> List[Dict]:
    """
    Filter the WHO publications list by query string matching title or description.
    (Simple case: substring match, case-insensitive).
    """
    q = query.lower()
    filtered = []
    for item in pubs:
        # Try to get a title field
        title = item.get("Title") or item.get("MetaTitle") or item.get("UrlName") or ""
        description = item.get("Description") or item.get("Summary") or item.get("MetaDescription") or ""
        if q in title.lower() or q in description.lower():
            filtered.append(item)
    return filtered


@tool
def search_who_pubs(query: str, limit: int = 5) -> List[Dict]:
    """
    Agent-tool: search WHO publications by query. Returns a list of dicts with
    title, link, summary/description, publication date.
    """
    pubs = fetch_who_publications(limit=50)  # fetch more; will filter
    matched = filter_publications_by_query(pubs, query)
    results = []
    for item in matched[:limit]:
        # build structured dict
        title = item.get("Title") or item.get("MetaTitle") or item.get("UrlName")
        description = item.get("Description") or item.get("Summary") or item.get("MetaDescription")
        pub_date = item.get("PublicationDate")
        url_name = item.get("UrlName")
        # Construct a link (assuming UrlName maps to some WHO URL)
        # Often WHO articles at: https://www.who.int/publications/<UrlName>
        link = None
        if url_name:
            link = f"https://www.who.int/publications/{url_name}"
        results.append({
            "title": title,
            "link": link,
            "description": description,
            "publication_date": pub_date
        })
    return results
