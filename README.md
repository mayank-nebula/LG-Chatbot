def search_pmc(question: SystemError) -> list[str]:
    """
    Search PubMed Central (PMC) for articles related to the question.
    Returns a list of PMCIDs (strings).
    """
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {"db": "pmc", "term": question, "retmax": 3, "retmode": "json"}
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()
    return data["esearchresult"]["idlist"]  # list[str]


def _parse_pmc_xml(xml_text: str) -> dict:
    """
    Parse PMC XML into structured dict with title, abstract, body, and link.
    """
    root = ET.fromstring(xml_text)

    # Title
    title_node = root.find(".//front//article-meta//title-group//article-title")
    title = " ".join(title_node.itertext()).strip() if title_node is not None else None

    # Abstract
    abstract_node = root.find(".//abstract")
    abstract = (
        " ".join(abstract_node.itertext()).strip()
        if abstract_node is not None
        else None
    )

    # Body
    body_node = root.find(".//body")
    body = " ".join(body_node.itertext()).strip() if body_node is not None else None

    # PMCID
    pmcid_node = root.find('.//article-id[@pub-id-type="pmcid"]')
    pmcid = pmcid_node.text.strip() if pmcid_node is not None else None
    link = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/" if pmcid else None

    return {
        "pmcid": pmcid,
        "title": title,
        "abstract": abstract,
        "body": body,
        "link": link,
    }


def fetch_pmc(pmcid: str) -> dict:
    """
    Fetch and parse a PMC article by PMCID.
    Returns dict with pmcid, title, abstract, body, and link.
    """
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    params = {"db": "pmc", "id": pmcid, "retmode": "xml"}
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    return _parse_pmc_xml(resp.text)


@tool
def search_and_fetch_pmc(question: str) -> list[dict]:
    """
    Agent-facing tool:
    Search PMC for a question and return a list of parsed article dicts:
    [{pmcid, title, abstract, body, link}, ...]
    """
    pmcids = search_pmc(question)
    results = []
    for pmcid in pmcids:
        try:
            article = fetch_pmc(pmcid)
            results.append(article)
        except Exception as e:
            print(f"Error fetching {pmcid}: {e}")
    print(results)
    return results
