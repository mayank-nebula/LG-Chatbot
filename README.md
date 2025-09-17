import os
import json
import csv
import re
from io import StringIO
from typing import List, Dict, Any, Optional, Union


# Type aliases for better readability
KontentItem = Dict[str, Any]
KontentResponse = Dict[str, Any]
CSVRow = List[str]


HEALTH_OVERVIEW: Dict[str, Any] = {
    "title": "Annual Global Health Appropriations (FY17-FY25 Enacted, FY26 Proposed) in USD Billion",
    "description": (
        "The sharp reversal is reflected in the FY26 US budget request, "
        "which proposes sweeping cuts across global health programs — "
        "including the elimination of funding for family planning, maternal health, "
        "Gavi, UNICEF, and WHO, and deep reductions to HIV, TB, and malaria initiatives."
    ),
    "content_ids": [
        "agency_state",
        "agency_usaid",
        "agency_combined_proposal",
    ],
}

OUTPUT_FOLDER: str = "us_global_service"
OUTPUT_FILE: str = "health_overview.csv"


def extract_element(entry: Dict[str, Any], field: str, default: Any = None) -> Any:
    """Safely extract a value from a Kontent item element."""
    return entry.get("elements", {}).get(field, {}).get("value", default)


def write_csv(filepath: str, header: List[str], rows: List[CSVRow]) -> None:
    """Write data to CSV file."""
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)


async def fetch_kontent_data(item_id: str) -> KontentResponse:
    """Fetch data from Kontent API. This function should be implemented based on your API setup."""
    # This is a placeholder - implement your actual Kontent API call here
    pass


async def process_health_overview() -> None:
    """Process health overview data and save to CSV."""
    # Ensure output folder exists
    output_dir: str = os.path.join(os.getcwd(), OUTPUT_FOLDER)
    os.makedirs(output_dir, exist_ok=True)

    header: List[str] = ["Agency", "Year", "Value"]
    rows: List[CSVRow] = []

    content_ids: List[str] = HEALTH_OVERVIEW.get("content_ids", [])
    for content_id in content_ids:
        kontent_item: KontentResponse = await fetch_kontent_data(item_id=content_id)

        agency_data: List[Dict[str, Any]] = extract_element(kontent_item["item"], "agency", [{}])
        agency: Optional[str] = agency_data[0].get("name") if agency_data else None

        modular_content: Dict[str, Any] = kontent_item.get("modular_content", {})
        for entry in modular_content.values():
            year_data: List[Dict[str, Any]] = extract_element(entry, "year", [{}])
            year: Optional[str] = year_data[0].get("name") if year_data else None
            value: Any = extract_element(entry, "value")
            rows.append([str(agency) if agency else "", str(year) if year else "", str(value) if value else ""])

    filepath: str = os.path.join(output_dir, OUTPUT_FILE)
    write_csv(filepath, header, rows)


# Deconstructing USAID Support
DECONSTRUCTING_USAID_SUPPORT: Dict[str, Any] = {
    "title": "Deconstructing USAID Support",
    "description": (
        "A cross-sector snapshot of award terminations, funding reductions, "
        "and the uneven survivability of USAID programs in FY24–25."
    ),
    "content_blocks": {
        "awards_comparison": {
            "title": "Awards comparison",
            "data_title": "Total USAID Awards",
            "content": {
                "number_of_awards": [
                    "active_awards_value_7c631ec",
                    "terminated_awards_value",
                ]
            },
        },
        "funding_allocation": {
            "title": "Funding Allocation",
            "data_title": "Total Estimated Cost",
            "content": {
                "total_estimated_cost_usd_billion": [
                    "active_awards_value_e3ab116",
                    "terminated_awards_value_e25ed55",
                ],
                "total_obligated_amount_usd_billion": [
                    "active_awards_8375cfe",
                    "terminated_awards_5db0f6c",
                ],
            },
        },
    },
}

DECONSTRUCTING_OUTPUT_FILE: str = "deconstructing_usaid_support_data.csv"


async def build_row(content_title: str, data_title: str, item_id: str) -> CSVRow:
    """Fetch Kontent item and return a row for CSV export."""
    kontent_item: KontentResponse = await fetch_kontent_data(item_id=item_id)

    label: Any = extract_element(kontent_item["item"], "label")
    value: Any = extract_element(kontent_item["item"], "value")
    type_data: List[Dict[str, Any]] = extract_element(kontent_item["item"], "type", [{}])
    type_name: Optional[str] = type_data[0].get("name") if type_data else None

    return [
        content_title,
        data_title,
        str(label) if label else "",
        str(type_name) if type_name else "",
        str(value) if value else ""
    ]


async def process_deconstructing_usaid_support() -> None:
    """Process deconstructing USAID support data and save to CSV."""
    # Ensure output folder exists
    output_dir: str = os.path.join(os.getcwd(), OUTPUT_FOLDER)
    os.makedirs(output_dir, exist_ok=True)

    header: List[str] = ["Title", "Data Title", "Label", "Type", "Value"]
    rows: List[CSVRow] = []

    blocks: Dict[str, Any] = DECONSTRUCTING_USAID_SUPPORT["content_blocks"]

    # Process Awards Comparison
    awards_block: Dict[str, Any] = blocks["awards_comparison"]
    number_of_awards: List[str] = awards_block["content"]["number_of_awards"]
    for item_id in number_of_awards:
        row: CSVRow = await build_row(awards_block["title"], awards_block["data_title"], item_id)
        rows.append(row)

    # Process Funding Allocation
    funding_block: Dict[str, Any] = blocks["funding_allocation"]
    funding_items: List[str] = (
        funding_block["content"]["total_estimated_cost_usd_billion"]
        + funding_block["content"]["total_obligated_amount_usd_billion"]
    )

    for item_id in funding_items:
        row: CSVRow = await build_row(funding_block["title"], funding_block["data_title"], item_id)
        rows.append(row)

    filepath: str = os.path.join(output_dir, DECONSTRUCTING_OUTPUT_FILE)
    write_csv(filepath, header, rows)


# Fund Utilization Card
FUND_UTILIZATION_CARD: Dict[str, Any] = {
    "title": "Fund Utilization",
    "data_title": "Total Obligated Funds",
    "content_blocks": {
        "committed_funds": {
            "content": {
                "Committed Funds* (In USD Billion)": [
                    "active_awards_value_bfd877a",
                    "terminated_awards_value_accde2f",
                ]
            },
        },
        "remaining_funds": {
            "content": {
                "Remaining Funds (In USD Billion)": [
                    "active_awards_value_856fdc9",
                    "terminated_awards_value_033050e",
                ]
            },
        },
        "unspent_funds": {
            "content": {
                "Unspent Funds (In USD Billion)": [
                    "active_awards_value_295cdc7",
                    "terminated_awards_value_3141e87",
                ]
            },
        },
    },
}

FUND_UTILIZATION_OUTPUT_FILE: str = "fund_utilization_card.csv"


async def build_fund_row(title: str, data_title: str, fund_info: str, item_id: str) -> CSVRow:
    """Fetch Kontent item and return a row for CSV export."""
    kontent_item: KontentResponse = await fetch_kontent_data(item_id=item_id)

    label: Any = extract_element(kontent_item["item"], "label")
    value: Any = extract_element(kontent_item["item"], "value")
    type_data: List[Dict[str, Any]] = extract_element(kontent_item["item"], "type", [{}])
    type_name: Optional[str] = type_data[0].get("name") if type_data else None

    return [
        title,
        data_title,
        fund_info,
        str(label) if label else "",
        str(type_name) if type_name else "",
        str(value) if value else ""
    ]


async def process_fund_utilization_card() -> None:
    """Process fund utilization card data and save to CSV."""
    # Ensure output folder exists
    output_dir: str = os.path.join(os.getcwd(), OUTPUT_FOLDER)
    os.makedirs(output_dir, exist_ok=True)

    header: List[str] = ["Title", "Data Title", "Fund Info", "Label", "Type", "Value"]
    rows: List[CSVRow] = []

    title: str = FUND_UTILIZATION_CARD["title"]
    data_title: str = FUND_UTILIZATION_CARD["data_title"]

    content_blocks: Dict[str, Any] = FUND_UTILIZATION_CARD["content_blocks"]
    for block in content_blocks.values():
        content: Dict[str, List[str]] = block["content"]
        for fund_info, item_ids in content.items():
            for item_id in item_ids:
                row: CSVRow = await build_fund_row(title, data_title, fund_info, item_id)
                rows.append(row)

    filepath: str = os.path.join(output_dir, FUND_UTILIZATION_OUTPUT_FILE)
    write_csv(filepath, header, rows)


# USAID Global Health Award Termination
USAID_GLOBAL_HEALTH_AWARD_TERMINATION: Dict[str, Any] = {
    "title": "USAID Global Health Award Termination",
    "sub_title": (
        "Global Health constitutes only 12% of total USAID awards — yet 80% of those "
        "are marked for termination, and 66% of Global Health unobligated funding "
        "is tied to terminated programs."
    ),
    "content_blocks": {
        "share_of_global_health_awards": {
            "title": "Share of Global Health Awards",
            "data_title": "Total number of USAID Awards",
            "content": {
                "number_of_awards": [
                    "active_awards_item",
                    "terminated_awards_item",
                ]
            },
        },
        "status_of_global_health_awards": {
            "title": "Status of Global Health Awards",
            "data_title": "Total number of Global Health Awards",
            "content": {
                "program_type": [
                    "active_programs_value",
                    "terminated_awards_value_019a450",
                ]
            },
        },
    },
}

USAID_HEALTH_OUTPUT_FILE: str = "usaid_global_health_award_termination_section.csv"


async def build_health_row(block_title: str, data_title: str, item_id: str) -> CSVRow:
    """Fetch Kontent item and return a row for CSV export."""
    kontent_item: KontentResponse = await fetch_kontent_data(item_id=item_id)

    label: Any = extract_element(kontent_item["item"], "label")
    value: Any = extract_element(kontent_item["item"], "value")
    type_data: List[Dict[str, Any]] = extract_element(kontent_item["item"], "type", [{}])
    type_name: Optional[str] = type_data[0].get("name") if type_data else None

    return [
        block_title,
        data_title,
        str(label) if label else "",
        str(type_name) if type_name else "",
        str(value) if value else ""
    ]


async def process_usaid_global_health_award_termination_section() -> None:
    """Process USAID global health award termination data and save to CSV."""
    # Ensure output folder exists
    output_dir: str = os.path.join(os.getcwd(), OUTPUT_FOLDER)
    os.makedirs(output_dir, exist_ok=True)

    header: List[str] = ["Title", "Data Title", "Label", "Type", "Value"]
    rows: List[CSVRow] = []

    blocks: Dict[str, Any] = USAID_GLOBAL_HEALTH_AWARD_TERMINATION["content_blocks"]

    for block in blocks.values():
        block_title: str = block["title"]
        data_title: str = block["data_title"]

        content: Dict[str, List[str]] = block["content"]
        for item_ids in content.values():
            for item_id in item_ids:
                row: CSVRow = await build_health_row(block_title, data_title, item_id)
                rows.append(row)

    filepath: str = os.path.join(output_dir, USAID_HEALTH_OUTPUT_FILE)
    write_csv(filepath, header, rows)


# Breakdown of USAID Data
BREAKDOWN_OF_USAID_DATA: Dict[str, Any] = {
    "title": "Breakdown of USAID FY24–25 Budget Cuts and Preservation",
    "sub_title": (
        "Although more funding was preserved than cut in absolute terms, "
        "a larger share of the Health budget was cut (41%) compared to "
        "Non-Health (37%), indicating a shift in funding priorities."
    ),
    "content_blocks": {
        "health": {
            "title": "Health",
            "data_title": "Total Obligation",
            "table": "usaid_global_health_programs",
        },
        "non_health": {
            "title": "Non-Health",
            "data_title": "Total Obligation",
            "table": "usaid_non_health_programs",
        },
    },
}

BREAKDOWN_SUBFOLDER: str = "breakdown_of_usaid_data"


async def process_breakdown_of_usaid_data() -> None:
    """Process breakdown of USAID data and save to CSV files."""
    # Ensure output folders exist
    output_dir: str = os.path.join(os.getcwd(), OUTPUT_FOLDER, BREAKDOWN_SUBFOLDER)
    os.makedirs(output_dir, exist_ok=True)

    blocks: Dict[str, Any] = BREAKDOWN_OF_USAID_DATA["content_blocks"]

    for block in blocks.values():
        table_id: str = block["table"]

        kontent_table: KontentResponse = await fetch_kontent_data(item_id=table_id)

        # Extract headers
        header_str: str = extract_element(kontent_table["item"], "header_row", "")
        column_headers: List[str] = [h.strip() for h in header_str.split("-")]

        # Extract rows
        rows: List[CSVRow] = []
        modular_content: Dict[str, Any] = kontent_table.get("modular_content", {})
        for entry in modular_content.values():
            row_str: str = extract_element(entry, "row_data", "")
            row: CSVRow = [cell.strip() for cell in row_str.split("-")]
            rows.append(row)

        # Write to CSV
        filepath: str = os.path.join(output_dir, f"{table_id}.csv")
        write_csv(filepath, column_headers, rows)


# Projected Mortality
projected_mortality_from_usaid_defunding: Dict[str, Any] = {
    "title": "Projected Mortality from USAID Defunding",
    "sub_title": "Ending USAID support could cause 14 million deaths by 2030, including 4.5 million among under-five children.",
    "data_title": "Mortality Projection (2025-2030)",
    "table": "mortality_projection__2025_2030_",
}


async def process_projected_mortality_from_usaid_defunding() -> None:
    """Process mortality projections and save them into a CSV file."""
    base_folder: str = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(base_folder, exist_ok=True)

    table_id: str = projected_mortality_from_usaid_defunding["table"]
    data: KontentResponse = await fetch_kontent_data(item_id=table_id)

    # Extract headers
    header_string: str = data["item"]["elements"]["header_row"]["value"]
    column_headers: List[str] = [col.strip() for col in header_string.split("-")]

    # Extract row data
    row_data: List[CSVRow] = []
    modular_content: Dict[str, Any] = data["modular_content"]
    for modular_item in modular_content.values():
        row_string: str = modular_item["elements"]["row_data"]["value"]
        row: CSVRow = [val.strip() for val in row_string.split("-")]
        row_data.append(row)

    # Save to CSV
    filepath: str = os.path.join(base_folder, "projected_mortality_from_usaid_defunding.csv")
    write_csv(filepath, column_headers, row_data)


# Countries by Share of Total DAH
countries_by_share_of_total_dah_from_the_us_in_23: Dict[str, Any] = {
    "title": "Countries by Share of Total DAH from the US in 2023",
    "sub_title": "In 2023, US DAH accounted for more than 25% of total DAH in 51 countries, with 13 of those countries receiving over 50% of their aid from the US.",
    "data_title": "Countries by Share of Total DAH from the US in 2023",
    "table": "us_health_oda_bubble_chart",
}


async def process_countries_by_share_of_total_dah_from_the_us_in_23() -> None:
    """Process DAH country share data and save to CSV."""
    base_folder: str = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(base_folder, exist_ok=True)

    table_id: str = countries_by_share_of_total_dah_from_the_us_in_23["table"]
    data: KontentResponse = await fetch_kontent_data(item_id=table_id)

    # Extract headers
    header_string: str = data["item"]["elements"]["header_row"]["value"]
    column_headers: List[str] = [col.strip() for col in header_string.split(",")]

    # Extract rows
    row_data: List[CSVRow] = []
    modular_content: Dict[str, Any] = data["modular_content"]
    for modular_item in modular_content.values():
        row_string: str = modular_item["elements"]["row_data"]["value"]
        row: CSVRow = [val.strip() for val in row_string.split(",")]
        row_data.append(row)

    # Save to CSV
    filepath: str = os.path.join(base_folder, "countries_by_share_of_total_dah_from_the_us_in_23.csv")
    write_csv(filepath, column_headers, row_data)


# Impact of USAID Support
impact_of_usaid_support_data: Dict[str, Any] = {
    "title": "Impact of USAID Support",
    "sub_title": "Over 92 million lives were saved by USAID programs between 2001 and 2021, yet upcoming program exits threaten to reverse this progress.",
    "custom_content": {
        "high_usaid_support_correlates_data": {
            "title": "High USAID Support Correlates with Lower Mortality from HIV, Malaria, and More",
            "data_title": (
                "The number of deaths averted by USAID between 2001 and 2021 was "
                "estimated using a counterfactual scenario in which USAID funding was "
                "set to zero while all other variables were held constant. Analysis is "
                "based on 2,793 observations across 133 countries and territories "
                "over a 20-year period (2001–2021)."
            ),
            "table": "impact_of_usaid_support_table_data",
        }
    },
}


def custom_split(text: str) -> List[str]:
    """Split row data into structured fields based on keywords (Low, High, Intermediate)."""
    match: Optional[re.Match[str]] = re.search(r"\b(Low|High|Intermediate)\b", text)
    if match:
        idx: int = match.start()
        first_part: str = text[:idx].rstrip("-")
        second_part: str = text[idx:].lstrip("-")

        # Split further if there are "-" delimiters
        second_split: List[str] = second_part.split("-") if second_part else []
        return [first_part] + second_split

    return [text]


async def process_impact_of_usaid_support_data() -> None:
    """Process USAID support impact data and save to CSV."""
    base_folder: str = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(base_folder, exist_ok=True)

    # Fixed headers (domain-specific)
    column_headers: List[str] = [
        "Cause / Age",
        "USAID Funding Level",
        "Rate Ratio (RR) (X-Axis)",
        "95% CI",
        "P-value",
        "Total number of deaths prevented by USAID (2001-2021)* in millions",
        "Percentage of deaths averted relative to total deaths (2001–21)*",
    ]

    row_data: List[CSVRow] = []
    custom_content: Dict[str, Any] = impact_of_usaid_support_data["custom_content"]
    table_id: str = custom_content["high_usaid_support_correlates_data"]["table"]
    data: KontentResponse = await fetch_kontent_data(item_id=table_id)

    modular_content: Dict[str, Any] = data["modular_content"]
    for modular_item in modular_content.values():
        row_text: str = modular_item["elements"]["row_data"]["value"].strip("\n")
        row_data.append(custom_split(row_text))

    filepath: str = os.path.join(base_folder, "impact_of_usaid_support_data.csv")
    write_csv(filepath, column_headers, row_data)


async def _process_oda_data(
    country_name: str, 
    country_code: str, 
    oda_refs: List[str]
) -> List[CSVRow]:
    """Process ODA data for a single country."""
    oda_rows: List[CSVRow] = []
    
    if not oda_refs:
        return oda_rows
        
    oda_data: KontentResponse = await fetch_kontent_data(item_id=oda_refs[0])
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
) -> List[CSVRow]:
    """Process sub-sector data for a single sector."""
    funding_rows: List[CSVRow] = []
    
    for sub_sector_ref in sub_sector_refs:
        sub_sector_data: KontentResponse = await fetch_kontent_data(item_id=sub_sector_ref)
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
) -> List[CSVRow]:
    """Process all sector data for a single country."""
    all_funding_rows: List[CSVRow] = []
    
    for sector_ref in sector_refs:
        sector_data: KontentResponse = await fetch_kontent_data(item_id=sector_ref)
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
    page_data: KontentResponse = await fetch_kontent_data(item_id="global_health_funding_page")

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
    all_oda_rows: List[CSVRow] = []
    all_funding_rows: List[CSVRow] = []

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
    page_data: KontentResponse = await fetch_kontent_data(item_id="usaid_s_surviving_programs")

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
    row_data: List[CSVRow] = []

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
    page_data: KontentResponse = await fetch_kontent_data(item_id="vital_health_services_disrupted")

    # Extract references
    title: str = page_data["item"]["elements"]["section_title"]["value"]
    pie_chart_refs: List[str] = page_data["item"]["elements"]["pie_chart_data"]["value"]
