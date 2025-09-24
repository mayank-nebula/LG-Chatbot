import requests


def search_clinical_trials(query: str, max_results: int = 3):
    """
    Search ClinicalTrials.gov v2 API for studies related to the query.
    Returns structured dicts with useful study details.
    """
    url = "https://clinicaltrials.gov/api/v2/studies"
    params = {"query.term": query, "pageSize": max_results}
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    studies = resp.json().get("studies", [])

    results = []
    for study in studies:
        proto = study.get("protocolSection", {})

        ident = proto.get("identificationModule", {})
        conds = proto.get("conditionsModule", {}).get("conditions", [])
        desc = proto.get("descriptionModule", {}).get("briefSummary")
        status = proto.get("statusModule", {}).get("overallStatus")
        phase = proto.get("designModule", {}).get("phases", [])
        study_type = proto.get("designModule", {}).get("studyType")
        start_date = (
            proto.get("statusModule", {}).get("startDateStruct", {}).get("date")
        )
        completion_date = (
            proto.get("statusModule", {}).get("completionDateStruct", {}).get("date")
        )

        eligibility = proto.get("eligibilityModule", {}).get("eligibilityCriteria")
        primary_outcomes = proto.get("outcomesModule", {}).get("primaryOutcomes", [])
        interventions = proto.get("armsInterventionsModule", {}).get(
            "interventions", []
        )
        locations = proto.get("contactsLocationsModule", {}).get("locations", [])

        results.append(
            {
                "nctId": ident.get("nctId"),
                "title": ident.get("briefTitle"),
                "conditions": conds,
                "summary": desc,
                "status": status,
                "phase": phase,
                "studyType": study_type,
                "startDate": start_date,
                "completionDate": completion_date,
                "eligibilityCriteria": eligibility,
                "primaryOutcomes": primary_outcomes,
                "interventions": interventions,
                "locations": locations,
                "url": f"https://clinicaltrials.gov/study/{ident.get('nctId')}",
            }
        )
    return results
