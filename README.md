def fetch_modular_content(item_id: str) -> dict:
    """Fetch modular_content from a given item ID."""
    url = f"{BASE_URL}/{ENVIRONMENT_ID}/items/{item_id}"
    response = requests.get(url, headers=headers)
    return response.json().get("modular_content", {})


def parse_oda_data(country_name: str, country_code: str, oda_ref: str) -> list:
    """Extract ODA rows for a country."""
    oda_rows = []
    oda_content = fetch_modular_content(oda_ref)

    for oda_item in oda_content.values():
        year = oda_item["elements"]["year"]["value"][0]["name"]
        value = oda_item["elements"]["value"]["value"]
        oda_rows.append([country_name, country_code, year, value])

    return oda_rows


def parse_sector_data(country_name: str, country_code: str, sector_refs: list) -> list:
    """Extract funding rows for all sectors and sub-sectors of a country."""
    funding_rows = []

    for sector_ref in sector_refs:
        sector_content = fetch_modular_content(sector_ref)

        for sector_item in sector_content.values():
            sector_name = sector_item["elements"]["sector"]["value"][0]["name"]
            sub_sector_refs = sector_item["elements"]["sub_sector"]["value"]

        for sub_sector_ref in sub_sector_refs:
            sub_sector_content = fetch_modular_content(sub_sector_ref)

            for sub_sector_item in sub_sector_content.values():
                sub_sector_name = sub_sector_item["system"]["name"]
                year = sub_sector_item["elements"]["year"]["value"][0]["name"]
                value = sub_sector_item["elements"]["value"]["value"]

                clean_sub_sector_name = (
                    sub_sector_name.replace(country_name, "")
                    .replace(year, "")
                    .strip()
                )

                funding_rows.append(
                    [country_name, country_code, year, sector_name, clean_sub_sector_name, value]
                )

    return funding_rows


def write_csv(filepath: str, header: list, rows: list) -> None:
    """Write rows to a CSV file with header."""
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)


def process_global_health_funding():
    url = f"{BASE_URL}/{ENVIRONMENT_ID}/items/global_health_funding_page"
    response = requests.get(url, headers=headers)
    page_data = response.json()

    kontent_service_folder = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(kontent_service_folder, exist_ok=True)

    global_health_folder = os.path.join(kontent_service_folder, "global_health_funding_page")
    os.makedirs(global_health_folder, exist_ok=True)

    # Extract metadata (not used later, but available if needed)
    title = page_data["item"]["elements"]["title"]["value"]
    subtitle = page_data["item"]["elements"]["sub_title"]["value"]
    map_source = page_data["item"]["elements"]["map_data_source"]["value"]
    top_countries_title = page_data["item"]["elements"]["top_10_countries_title"]["value"]

    country_items = page_data.get("modular_content", {})

    oda_header = ["Country", "Country Code", "Year", "Overall ODA Value"]
    funding_header = ["Country", "Country Code", "Year", "Sector", "Sub Sector", "Value"]

    oda_rows = []
    funding_rows = []

    # Process each country
    for country_item in country_items.values():
        country_name = country_item["elements"]["country_name"]["value"]
        country_code = country_item["elements"]["country_code"]["value"]
        sector_refs = country_item["elements"]["sector_data"]["value"]
        oda_refs = country_item["elements"]["overall_oda"]["value"]

        oda_rows.extend(parse_oda_data(country_name, country_code, oda_refs[0]))
        funding_rows.extend(parse_sector_data(country_name, country_code, sector_refs))

    # Write results
    write_csv(os.path.join(global_health_folder, "overall_oda.csv"), oda_header, oda_rows)
    write_csv(os.path.join(global_health_folder, "global_health_funding.csv"), funding_header, funding_rows)
