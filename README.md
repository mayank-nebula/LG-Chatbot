impact_analysis = {
    "geographies_most_exposed": {
        "title": "Geographies Most Exposed to US Global Health Funding",
        "sub-title": "Potential funding cuts could hit Sub-Saharan Africa hardest: the region most reliant on US health aid and projected by IHME to face steep spending declines, threatening Sustainable Development Goal (SDG) progress.",
        "tables": {
            "total_health_oda_all_donors": None,
            "total_health_oda_table": None,
            "usaid_disbursements_table_fe42fc28_b67c_4033_b2da_c_9fac4a91": None,
            "us_share_of_total_oda_": None,
            "relative_reduction_in_total_health_pending_the": None,
            "usaid_share_of_total_oda_": "parse_header",
            "usaid_ais_as__of_gghe_d": "parse_header",
            "usaid_as__of_gghe_d": "parse_header",
        },
    },
    "country_level_qualitative_insights_data": {
        "title": "Country-Level Qualitative Insights",
        "sub-title": "",
        "tables": {"qualitative_insights_table": "parse_line"},
    },
}


def parse_line(line: str, num_columns: int) -> List:
    """Parse a string to a correct csv row."""
    tokens = line.strip().split(",")
    fields = []

    first = tokens[0].strip()
    fields.append(first)

    current = []
    for token in tokens[1:]:
        token = token.strip()
        current.append(token)
        if token.endswith("."):
            field = ",".join(current).strip()
            fields.append(field)
            current = []
            if len(fields) == num_columns:
                break

    while len(fields) < num_columns:
        fields.append("")

    return fields


async def process_table(
    base_folder: str, section: str, item: str, function_to_use: Optional[str]
) -> None:
    """Fetch data for one table and write CSV."""
    data = await fetch_kontent_data(item_id=item)
    if not data:
        return

    try:
        header_string = data["item"]["elements"]["header_row"]["value"]
    except KeyError:
        print(f"No header_row found for {item}")
        return

    if function_to_use == "parse_header":
        header_string = header_string.replace("\t", ",")

    header = [h.strip() for h in header_string.split(",") if h.strip()]

    if item == "relative_reduction_in_total_health_pending_the":
        header.insert(0, "Country")
        header.insert(1, "Code")
        header.insert(2, "Region")
    elif item in [
        "total_health_oda_all_donors",
        "total_health_oda_table",
        "usaid_disbursements_table_fe42fc28_b67c_4033_b2da_c_9fac4a91",
        "us_share_of_total_oda_",
        "usaid_share_of_total_oda_",
        "usaid_ais_as__of_gghe_d",
        "usaid_as__of_gghe_d",
    ]:
        header.insert(0, "Country")

    num_columns = len(header)

    modular_content = data.get("modular_content", {})
    raw_rows = [
        mc_value["elements"]["row_data"]["value"]
        for mc_value in modular_content.values()
        if "elements" in mc_value and "row_data" in mc_value["elements"]
    ]

    if function_to_use == "parse_line":
        parsed_rows = [parse_line(row, num_columns) for row in raw_rows]
    else:
        parsed_rows = [
            [
                "" if cell.strip() in ("..", "--", "-") else cell
                for cell in next(csv.reader(StringIO(row)))
            ]
            for row in raw_rows
        ]

    filepath = os.path.join(base_folder, section, f"{item}.csv")
    write_csv(filepath, header, parsed_rows)


async def process_impact_analysis():
    base_folder = os.path.join(os.getcwd(), "impact_analysis")
    os.makedirs(base_folder, exist_ok=True)

    tasks = []
    for section, value in impact_analysis.items():
        section_path = os.path.join(base_folder, section)
        os.makedirs(section_path, exist_ok=True)

        for item, function_to_use in value["tables"].items():
            tasks.append(process_table(base_folder, section, item, function_to_use))

    await asyncio.gather(*tasks)
    
    
    
    
    async def _process_oda_data(
    country_name: str, 
    country_code: str, 
    oda_refs: List[str]
) -> List[List[str]]:
    """Process ODA data for a single country."""
    oda_rows: List[List[str]] = []
    
    if not oda_refs:
        return oda_rows
        
    oda_data: Dict[str, Any] = await fetch_kontent_data(item_id=oda_refs[0])
    oda_content: Dict[str, Any] = oda_data.get("modular_content", {})

    for oda_item in oda_content.values():
        year_data: List[Dict[str, Any]] = oda_item["elements"]["year"]["value"]
        year: str = year_data[0]["name"] if year_data else ""
        value: Any = oda_item["elements"]["value"]["value"]
        oda_rows.append([country_name, country_code, year, str(value)])
    
    return oda_rows


async def _process_sub_sector_data(
    country_name: str,
    country_code: str, 
    sector_name: str,
    sub_sector_refs: List[str]
) -> List[List[str]]:
    """Process sub-sector data for a single sector."""
    funding_rows: List[List[str]] = []
    
    for sub_sector_ref in sub_sector_refs:
        sub_sector_data: Dict[str, Any] = await fetch_kontent_data(item_id=sub_sector_ref)
        sub_sector_content: Dict[str, Any] = sub_sector_data.get("modular_content", {})

        for sub_sector_item in sub_sector_content.values():
            sub_sector_name: str = sub_sector_item["system"]["name"]
            year_data: List[Dict[str, Any]] = sub_sector_item["elements"]["year"]["value"]
            year: str = year_data[0]["name"] if year_data else ""
            value: Any = sub_sector_item["elements"]["value"]["value"]

            # Clean sub-sector name by removing redundant country/year
            clean_sub_sector_name: str = (
                sub_sector_name.replace(country_name, "")
                .replace(year, "")
                .strip()
            )

            funding_rows.append([
                country_name,
                country_code,
                year,
                sector_name,
                clean_sub_sector_name,
                str(value),
            ])
    
    return funding_rows


async def _process_sector_data(
    country_name: str,
    country_code: str,
    sector_refs: List[str]
) -> List[List[str]]:
    """Process all sector data for a single country."""
    all_funding_rows: List[List[str]] = []
    
    for sector_ref in sector_refs:
        sector_data: Dict[str, Any] = await fetch_kontent_data(item_id=sector_ref)
        sector_content: Dict[str, Any] = sector_data.get("modular_content", {})

        for sector_item in sector_content.values():
            sector_data_list: List[Dict[str, Any]] = sector_item["elements"]["sector"]["value"]
            sector_name: str = sector_data_list[0]["name"] if sector_data_list else ""
            sub_sector_refs: List[str] = sector_item["elements"]["sub_sector"]["value"]

            # Process sub-sectors for this sector
            sector_funding_rows = await _process_sub_sector_data(
                country_name, country_code, sector_name, sub_sector_refs
            )
            all_funding_rows.extend(sector_funding_rows)
    
    return all_funding_rows


async def process_global_health_funding() -> None:
    """Process global health funding data and export ODA + funding details to CSV."""
    base_folder: str = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(base_folder, exist_ok=True)

    page_folder: str = os.path.join(base_folder, "global_health_funding_page")
    os.makedirs(page_folder, exist_ok=True)

    # Fetch root page data
    page_data: Dict[str, Any] = await fetch_kontent_data(item_id="global_health_funding_page")

    # Extract key metadata (not used in CSV writing, but can be logged/stored if needed)
    title: str = page_data["item"]["elements"]["title"]["value"]
    sub_title: str = page_data["item"]["elements"]["sub_title"]["value"]
    map_source: str = page_data["item"]["elements"]["map_data_source"]["value"]
    top_countries_title: str = page_data["item"]["elements"]["top_10_countries_title"]["value"]

    country_items: Dict[str, Any] = page_data.get("modular_content", {})

    # CSV headers
    oda_headers: List[str] = ["Country", "Country Code", "Year", "Overall ODA Value"]
    funding_headers: List[str] = [
        "Country", "Country Code", "Year", "Sector", "Sub Sector", "Value"
    ]

    # Initialize result collections
    all_oda_rows: List[List[str]] = []
    all_funding_rows: List[List[str]] = []

    # Process each country
    for country_item in country_items.values():
        country_name: str = country_item["elements"]["country_name"]["value"]
        country_code: str = country_item["elements"]["country_code"]["value"]
        sector_refs: List[str] = country_item["elements"]["sector_data"]["value"]
        oda_refs: List[str] = country_item["elements"]["overall_oda"]["value"]

        # Process ODA data for this country
        oda_rows = await _process_oda_data(country_name, country_code, oda_refs)
        all_oda_rows.extend(oda_rows)

        # Process sector & sub-sector data for this country
        funding_rows = await _process_sector_data(country_name, country_code, sector_refs)
        all_funding_rows.extend(funding_rows)

    # Write CSV outputs
    oda_filepath: str = os.path.join(page_folder, "overall_oda.csv")
    write_csv(oda_filepath, oda_headers, all_oda_rows)

    funding_filepath: str = os.path.join(page_folder, "global_health_funding.csv")
    write_csv(funding_filepath, funding_headers, all_funding_rows)


async def process_usaid_s_surviving_programs() -> None:
    """Process USAID's surviving programs data and export table to CSV."""
    base_folder: str = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(base_folder, exist_ok=True)

    # Fetch page data
    page_data: Dict[str, Any] = await fetch_kontent_data(item_id="usaid_s_surviving_programs")

    # Extract metadata (not written to CSV, but could be stored/logged if needed)
    title: str = page_data["item"]["elements"]["title"]["value"]
    sub_title: str = page_data["item"]["elements"]["subtitle"]["value"]
    blue_text_refs: List[str] = page_data["item"]["elements"]["blue_text"]["value"]
    text: str = page_data["item"]["elements"]["text"]["value"]

    modular_content: Dict[str, Any] = page_data.get("modular_content", {})

    # Collect blue text values separately
    blue_text_values: Dict[str, str] = {
        key: value["elements"]["text"]["value"]
        for key, value in modular_content.items()
        if key in blue_text_refs
    }

    # Prepare CSV headers and rows
    column_headers: List[str] = []
    row_data: List[List[str]] = []

    for key, value in modular_content.items():
        if key not in blue_text_refs:
            columns_string: str = value["elements"]["columns"]["value"]
            column_headers = ["Type"] + [col.strip() for col in columns_string.split(",")]

            csv_lines: List[str] = value["elements"]["csv_data"]["value"].split("\n")
            for line in csv_lines:
                if line.strip():  # Skip empty lines
                    row_data.append(next(csv.reader(StringIO(line))))

    # Save table CSV
    filepath: str = os.path.join(base_folder, "usaid_s_surviving_programs.csv")
    write_csv(filepath, column_headers, row_data)


async def process_vital_health_services_disrupted() -> None:
    """Process vital health services disruption data and save as JSON."""
    base_folder: str = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(base_folder, exist_ok=True)

    # Fetch page data
    page_data: Dict[str, Any] = await fetch_kontent_data(item_id="vital_health_services_disrupted")

    # Extract references
    title: str = page_data["item"]["elements"]["section_title"]["value"]
    pie_chart_refs: List[str] = page_data["item"]["elements"]["pie_chart_data"]["value"]
