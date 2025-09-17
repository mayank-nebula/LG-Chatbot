impact_analysis = {
    "geographies_most_exposed": {
        "title": "Geographies Most Exposed to US Global Health Funding",
        "sub-title": "Potential funding cuts could hit Sub-Saharan Africa hardest...",
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


# Worker to fetch + process one table
async def process_table(
    base_folder: str, section: str, item: str, function_to_use: Optional[str]
) -> None:
    """Fetch data for one table and write CSV."""
    data = await fetch_modular_content(item_id=item)
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


# Main processor
async def process_impact_analysis():
    base_folder = os.path.join(os.getcwd(), "impact_analysis")
    os.makedirs(base_folder, exist_ok=True)

    tasks = []
    for section, value in impact_analysis.items():
        section_path = os.path.join(base_folder, section)
        os.makedirs(section_path, exist_ok=True)

        for item, function_to_use in value["tables"].items():
            tasks.append(process_table(base_folder, section, item, function_to_use))

    # Run all fetches + processing concurrently
    await asyncio.gather(*tasks)
