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


async def process_impact_analysis():
    impact_analysis_folder = os.path.join(os.getcwd(), "impact_analysis")
    os.makedirs(impact_analysis_folder, exist_ok=True)

    for key, value in impact_analysis.items():
        os.makedirs(os.path.join(impact_analysis_folder, key), exist_ok=True)
        for item, function_to_use in value["tables"].items():
            row_data = []

            data = await fetch_kontent_data(item_id=item)

            header_string = data["item"]["elements"]["header_row"]["value"]
            if function_to_use == "parse_header":
                header_string_cleaned = header_string.replace("\t", ",")
            else:
                header_string_cleaned = header_string

            header = [h.strip() for h in header_string_cleaned.split(",")]
            num_columns = len(header)

            modular_content = data["modular_content"]
            for _, modular_content_value in modular_content.items():
                row_data.append(modular_content_value["elements"]["row_data"]["value"])

            if function_to_use == "parse_line":
                parsed_rows = [parse_line(row, num_columns) for row in row_data]
            else:
                parsed_rows = [
                    [
                        "" if cell.strip() in ("..", "--", "-") else cell
                        for cell in next(csv.reader(StringIO(row)))
                    ]
                    for row in row_data
                ]

            write_csv(
                os.path.join(impact_analysis_folder, key, f"{item}.csv"),
                header,
                parsed_rows,
            )
