@tool
def search_pmc(question: str, retmax: int = 5) -> list[str]:
    """Search PubMed Central (PMC) for articles related to the question. Returns a list of PMC IDs."""
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {"db": "pmc", "term": question, "retmax": retmax, "retmode": "json"}
    r = requests.get(url, params=params)
    r.raise_for_status()
    return r.json()["esearchresult"]["idlist"]

@tool
def fetch_pmc(pmcid: str) -> str:
    """Fetch the full text (XML) of a PMC article by PMCID."""
    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    params = {"db": "pmc", "id": pmcid, "retmode": "xml"}
    r = requests.get(url, params=params)
    r.raise_for_status()
    return r.text
