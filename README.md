health_overview = {
    "title": "Annual Global Health Appropriations (FY17-FY25 Enacted, FY26 Proposed) in USD Billion",
    "description": "The sharp reversal is reflected in the FY26 US budget request, which proposes sweeping cuts across global health programs — including the elimination of funding for family planning, maternal health, Gavi, UNICEF, and WHO, and deep reductions to HIV, TB, and malaria initiatives.",
    "custom_content": [
        "agency_state",
        "agency_usaid",
        "agency_combined_proposal",
    ],
}


async def process_health_overview():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    header = ["Agency", "Year", "Value"]
    row_data = []

    for item in health_overview.get("custom_content"):
        data = await fetch_kontent_data(item_id=item)

        agency = data["item"]["elements"]["agency"]["value"][0]["name"]

        modular_content = data["modular_content"]
        for _, modular_content_value in modular_content.items():
            year = modular_content_value["elements"]["year"]["value"][0]["name"]
            value = modular_content_value["elements"]["value"]["value"]
            row_data.append([agency, year, value])

    filepath = os.path.join(us_global_service_folder, "health_overview.csv")
    write_csv(filepath, header, row_data)








deconstructing_usaid_support_data = {
    "title": "Deconstructing USAID Support",
    "description": "A cross-sector snapshot of award terminations, funding reductions, and the uneven survivability of USAID programs in FY24–25.",
    "custom_content": {
        "awards_comparison_card": {
            "title": "Awards comparison",
            "data-title": "Total USAID Awards",
            "content": {
                "number_of_awards": [
                    "active_awards_value_7c631ec",
                    "terminated_awards_value",
                ]
            },
        },
        "funding_allocation_data": {
            "title": "Funding Allocation",
            "data-title": "Total Estimated Cost",
            "content": {
                "total_estimated_cost__in_usd_billion__value": [
                    "active_awards_value_e3ab116",
                    "terminated_awards_value_e25ed55",
                ],
                "total_obligated_amount__in_usd_billion_": [
                    "active_awards_8375cfe",
                    "terminated_awards_5db0f6c",
                ],
            },
        },
    },
}


async def process_deconstructing_usaid_support_data():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    header = ["Title", "Data Title", "Label", "Type", "Value"]
    row_data = []

    custom_content = deconstructing_usaid_support_data["custom_content"]
    awards_comparison_card = custom_content["awards_comparison_card"]
    funding_allocation_data = custom_content["funding_allocation_data"]

    awards_comparison_card_title = awards_comparison_card["title"]
    awards_comparison_card_data_title = awards_comparison_card["data-title"]
    number_of_awards = awards_comparison_card["content"]["number_of_awards"]

    for award in number_of_awards:
        award_data = await fetch_kontent_data(item_id=award)

        label = award_data["item"]["elements"]["label"]["value"]
        value = award_data["item"]["elements"]["value"]["value"]
        type = award_data["item"]["elements"]["type"]["value"][0]["name"]

        row_data.append(
            [
                awards_comparison_card_title,
                awards_comparison_card_data_title,
                label,
                type,
                value,
            ]
        )

    funding_allocation_data_title = funding_allocation_data["title"]
    funding_allocation_data_data_title = funding_allocation_data["data-title"]
    total_estimated_cost__in_usd_billion__value = funding_allocation_data["content"][
        "total_estimated_cost__in_usd_billion__value"
    ]
    total_obligated_amount__in_usd_billion_ = funding_allocation_data["content"][
        "total_obligated_amount__in_usd_billion_"
    ]

    for item in (
        total_estimated_cost__in_usd_billion__value
        + total_obligated_amount__in_usd_billion_
    ):
        data = await fetch_kontent_data(item_id=item)

        label = data["item"]["elements"]["label"]["value"]
        value = data["item"]["elements"]["value"]["value"]
        type = data["item"]["elements"]["type"]["value"][0]["name"]

        row_data.append(
            [
                funding_allocation_data_title,
                funding_allocation_data_data_title,
                label,
                type,
                value,
            ]
        )

    filepath = os.path.join(
        us_global_service_folder,
        "deconstructing_usaid_support_data.csv",
    )
    write_csv(filepath, header, row_data)







fund_utilization_card = {
    "title": "Fund Utilization",
    "data-title": "Total Obligated Funds",
    "custom_content": {
        "committed_funds___in_usd_billion_sub_item": {
            "content": {
                "Committed Funds* (In USD Billion)": [
                    "active_awards_value_bfd877a",
                    "terminated_awards_value_accde2f",
                ]
            },
        },
        "remaining_funds__in_usd_billion__item": {
            "content": {
                "Remaining Funds (In USD Billion)": [
                    "active_awards_value_856fdc9",
                    "terminated_awards_value_033050e",
                ]
            },
        },
        "unspent_funds__in_usd_billion__value": {
            "content": {
                "Unspent Funds (In USD Billion)": [
                    "active_awards_value_295cdc7",
                    "terminated_awards_value_3141e87",
                ]
            },
        },
    },
}


async def process_fund_utilization_card():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    header = ["Title", "Data Title", "Fund Info", "Label", "Type", "Value"]
    row_data = []

    title = fund_utilization_card["title"]
    data_title = fund_utilization_card["data-title"]
    custom_content = fund_utilization_card["custom_content"]

    final_data = {
        "Committed Funds* (In USD Billion)": custom_content[
            "committed_funds___in_usd_billion_sub_item"
        ]["content"]["Committed Funds* (In USD Billion)"],
        "Remaining Funds (In USD Billion)": custom_content[
            "remaining_funds__in_usd_billion__item"
        ]["content"]["Remaining Funds (In USD Billion)"],
        "Unspent Funds (In USD Billion)": custom_content[
            "unspent_funds__in_usd_billion__value"
        ]["content"]["Unspent Funds (In USD Billion)"],
    }

    for key, values in final_data.items():
        for value in values:

            data = await fetch_kontent_data(item_id=value)

            label = data["item"]["elements"]["label"]["value"]
            value = data["item"]["elements"]["value"]["value"]
            type = data["item"]["elements"]["type"]["value"][0]["name"]

            row_data.append([title, data_title, key, label, type, value])

    filepath = os.path.join(
        us_global_service_folder,
        "fund_utilization_card.csv",
    )
    write_csv(filepath, header, row_data)






usaid_global_health_award_termination_section = {
    "title": "USAID Global Health Award Termination",
    "sub-title": "Global Health constitutes only 12% of total USAID awards — yet 80% of those are marked for termination, and 66% of Global Health unobligated funding is tied to terminated programs.",
    "custom_content": {
        "share_of_global_health_awards_data": {
            "title": "Share of Global Health Awards",
            "data-title": "Total number of USAID Awards",
            "content": {
                "number_of_awards_item": [
                    "active_awards_item",
                    "terminated_awards_item",
                ]
            },
        },
        "status_of_global_health_awards_item": {
            "title": "Status of Global Health Awards",
            "data-title": "Total number of Global Health Awards",
            "content": {
                "program_type_item": [
                    "active_programs_value",
                    "terminated_awards_value_019a450",
                ]
            },
        },
    },
}


async def process_usaid_global_health_award_termination_section():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    header = ["Title", "Data Title", "Label", "Type", "Value"]
    row_data = []

    custom_content = usaid_global_health_award_termination_section["custom_content"]
    share_of_global_health_awards_data = custom_content[
        "share_of_global_health_awards_data"
    ]
    status_of_global_health_awards_item = custom_content[
        "status_of_global_health_awards_item"
    ]

    share_of_global_health_awards_data_title = share_of_global_health_awards_data[
        "title"
    ]
    share_of_global_health_awards_data_data_title = share_of_global_health_awards_data[
        "data-title"
    ]
    number_of_awards_item = share_of_global_health_awards_data["content"][
        "number_of_awards_item"
    ]

    for award in number_of_awards_item:
        award_data = await fetch_kontent_data(item_id=award)

        label = award_data["item"]["elements"]["label"]["value"]
        value = award_data["item"]["elements"]["value"]["value"]
        type = award_data["item"]["elements"]["type"]["value"][0]["name"]

        row_data.append(
            [
                share_of_global_health_awards_data_title,
                share_of_global_health_awards_data_data_title,
                label,
                type,
                value,
            ]
        )

    status_of_global_health_awards_item_title = status_of_global_health_awards_item[
        "title"
    ]
    status_of_global_health_awards_item_data_title = (
        status_of_global_health_awards_item["data-title"]
    )
    program_type_item = status_of_global_health_awards_item["content"][
        "program_type_item"
    ]

    for item in program_type_item:
        data = await fetch_kontent_data(item_id=item)

        label = data["item"]["elements"]["label"]["value"]
        value = data["item"]["elements"]["value"]["value"]
        type = data["item"]["elements"]["type"]["value"][0]["name"]

        row_data.append(
            [
                status_of_global_health_awards_item_title,
                status_of_global_health_awards_item_data_title,
                label,
                type,
                value,
            ]
        )

    filepath = os.path.join(
        us_global_service_folder,
        "usaid_global_health_award_termination_section.csv",
    )
    write_csv(filepath, header, row_data)








breakdown_of_usaid_data = {
    "title": "Breakdown of USAID FY24–25 Budget Cuts and Preservation",
    "sub-title": "Although more funding was preserved than cut in absolute terms, a larger share of the Health budget was cut (41%) compared to Non-Health (37%), indicating a shift in funding priorities.",
    "custom_content": {
        "health_card_item": {
            "title": "Health",
            "data-title": "Total Obligation",
            "table": "usaid_global_health_programs",
        },
        "non_health_15c6ae9": {
            "title": "Non-Health",
            "data-title": "Total Obligation",
            "table": "usaid_non_health_programs",
        },
    },
}


async def process_breakdown_of_usaid_data():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)
    os.makedirs(
        os.path.join(us_global_service_folder, "breakdown_of_usaid_data"), exist_ok=True
    )

    custom_content = breakdown_of_usaid_data["custom_content"]

    for _, value in custom_content.items():
        row_data = []
        table = value["table"]

        data = await fetch_kontent_data(item_id=table)

        headers_string = data["item"]["elements"]["header_row"]["value"]
        column_headers = headers_string.split("-")

        modular_content = data["modular_content"]
        for _, modular_content_value in modular_content.items():
            row_data.append(
                item.strip()
                for item in modular_content_value["elements"]["row_data"]["value"]
                .strip()
                .split("-")
            )

        filepath = os.path.join(
            us_global_service_folder,
            "breakdown_of_usaid_data",
            f"{table}.csv",
        )
        write_csv(filepath, column_headers, row_data)





projected_mortality_from_usaid_defunding = {
    "title": "Projected Mortality from USAID Defunding",
    "sub-title": "Ending USAID support could cause 14 million deaths by 2030, including 4.5 million among under-five children.",
    "data-title": "Mortality Projection (2025-2030)",
    "table": "mortality_projection__2025_2030_",
}


async def process_projected_mortality_from_usaid_defunding():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    row_data = []
    table = projected_mortality_from_usaid_defunding["table"]

    data = await fetch_kontent_data(item_id=table)

    column_headers = [
        item.strip()
        for item in data["item"]["elements"]["header_row"]["value"].split("-", 2)
    ]

    modular_content = data["modular_content"]
    for _, modular_content_value in modular_content.items():
        row_data.append(
            [
                item.strip()
                for item in modular_content_value["elements"]["row_data"]["value"]
                .strip()
                .split("-")
            ]
        )

    filepath = os.path.join(
        us_global_service_folder,
        "projected_mortality_from_usaid_defunding.csv",
    )
    write_csv(filepath, column_headers, row_data)




countries_by_share_of_total_dah_from_the_us_in_23 = {
    "title": "Countries by Share of Total DAH from the US in 2023",
    "sub-title": "In 2023, US DAH accounted for more than 25% of total DAH in 51 countries, with 13 of those countries receiving over 50% of their aid from the US.",
    "data-title": "Countries by Share of Total DAH from the US in 2023",
    "table": "us_health_oda_bubble_chart",
}


async def process_countries_by_share_of_total_dah_from_the_us_in_23():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    row_data = []
    table = countries_by_share_of_total_dah_from_the_us_in_23["table"]

    data = await fetch_kontent_data(item_id=table)

    column_headers = [
        item.strip()
        for item in data["item"]["elements"]["header_row"]["value"].split(",")
    ]

    modular_content = data["modular_content"]
    for _, modular_content_value in modular_content.items():
        row_data.append(
            [
                item.strip()
                for item in modular_content_value["elements"]["row_data"]["value"]
                .strip()
                .split(",")
            ]
        )

    filepath = os.path.join(
        us_global_service_folder,
        "countries_by_share_of_total_dah_from_the_us_in_23.csv",
    )
    write_csv(filepath, column_headers, row_data)




impact_of_usaid_support_data = {
    "title": "Impact of USAID Support",
    "sub-title": "Over 92 million lives were saved by USAID programs between 2001 and 2021, yet upcoming program exits threaten to reverse this progress.",
    "custom_content": {
        "high_usaid_support_correlates_data": {
            "title": "High USAID Support Correlates with Lower Mortality from HIV, Malaria, and More",
            "data-title": "The number of deaths averted by USAID between 2001 and 2021 was estimated using a counterfactual scenario in which USAID funding was set to zero while all other variables were held constant. Analysis is based on 2,793 observations across 133 countries and territories over a 20-year period (2001–2021).",
            "table": "impact_of_usaid_support_table_data",
        }
    },
}


def custom_split(text):
    match = re.search(r"\b(Low|High|Intermediate)\b", text)
    if match:
        idx = match.start()
        first_part = text[:idx].rstrip("-")
        second_part = text[idx:].lstrip("-")

        second_split = second_part.split("-") if second_part else []
        return [first_part] + second_split

    return [text]


async def process_impact_of_usaid_support_data():
    us_global_service_folder = os.path.join(os.getcwd(), "us_global_service")
    os.makedirs(us_global_service_folder, exist_ok=True)

    column_headers = [
        "Cause / Age",
        "USAID Funding Level",
        "Rate Ratio (RR) (X-Axis)",
        "95% CI",
        "P-value",
        "Total number of deaths prevented by USAID (2001-2021)* in millions",
        "Percentage of deaths averted relative to total deaths (2001–21)*",
    ]
    row_data = []

    table = impact_of_usaid_support_data["custom_content"][
        "high_usaid_support_correlates_data"
    ]["table"]

    data = await fetch_kontent_data(item_id=table)

    modular_content = data["modular_content"]

    for _, value in modular_content.items():
        row_data.append(
            custom_split(value["elements"]["row_data"]["value"].strip("\n"))
        )

    filepath = os.path.join(
        us_global_service_folder,
        "impact_of_usaid_support_data.csv",
    )
    write_csv(filepath, column_headers, row_data)





async def process_global_health_funding():
    kontent_service_folder = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(kontent_service_folder, exist_ok=True)

    global_health_folder = os.path.join(
        kontent_service_folder, "global_health_funding_page"
    )
    os.makedirs(global_health_folder, exist_ok=True)

    page_data = await fetch_kontent_data(item_id="global_health_funding_page")

    title = page_data["item"]["elements"]["title"]["value"]
    subtitle = page_data["item"]["elements"]["sub_title"]["value"]
    map_source = page_data["item"]["elements"]["map_data_source"]["value"]
    top_countries_title = page_data["item"]["elements"]["top_10_countries_title"][
        "value"
    ]

    country_items = page_data.get("modular_content", {})

    oda_header = ["Country", "Country Code", "Year", "Overall ODA Value"]
    oda_rows = []

    funding_header = [
        "Country",
        "Country Code",
        "Year",
        "Sector",
        "Sub Sector",
        "Value",
    ]
    funding_rows = []

    for country_item in country_items.values():
        country_name = country_item["elements"]["country_name"]["value"]
        country_code = country_item["elements"]["country_code"]["value"]
        sector_refs = country_item["elements"]["sector_data"]["value"]
        oda_refs = country_item["elements"]["overall_oda"]["value"]

        oda_response = await fetch_kontent_data(item_id=oda_refs[0])
        oda_content = oda_response.json().get("modular_content", {})

        for oda_item in oda_content.values():
            year = oda_item["elements"]["year"]["value"][0]["name"]
            value = oda_item["elements"]["value"]["value"]
            oda_rows.append([country_name, country_code, year, value])

        for sector_ref in sector_refs:
            sector_response = await fetch_kontent_data(item_id=sector_ref)
            sector_content = sector_response.json().get("modular_content", {})

            for sector_item in sector_content.values():
                sector_name = sector_item["elements"]["sector"]["value"][0]["name"]
                sub_sector_refs = sector_item["elements"]["sub_sector"]["value"]

            for sub_sector_ref in sub_sector_refs:
                sub_sector_url = await fetch_kontent_data(item_id=sub_sector_ref)
                sub_sector_response = requests.get(sub_sector_url, headers=headers)
                sub_sector_content = sub_sector_response.json().get(
                    "modular_content", {}
                )

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
                        [
                            country_name,
                            country_code,
                            year,
                            sector_name,
                            clean_sub_sector_name,
                            value,
                        ]
                    )

    filepath = os.path.join(global_health_folder, "overall_oda.csv")
    write_csv(filepath, oda_header, oda_rows)

    filepath = os.path.join(global_health_folder, "global_health_funding.csv")
    write_csv(filepath, funding_header, funding_rows)







async def process_usaid_s_surviving_programs():
    kontent_service_folder = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(kontent_service_folder, exist_ok=True)

    page_data = await fetch_kontent_data(item_id="usaid_s_surviving_programs")

    title = page_data["item"]["elements"]["title"]["value"]
    sub_title = page_data["item"]["elements"]["subtitle"]["value"]
    blue_text = page_data["item"]["elements"]["blue_text"]["value"]
    table_data = page_data["item"]["elements"]["table_data"]["value"]
    text = page_data["item"]["elements"]["text"]["value"]

    modular_content = page_data["modular_content"]

    blue_text_value = {}

    column_headers = []
    row_data = []

    for key, value in modular_content.items():
        if key in blue_text:
            blue_text_value[key] = value["elements"]["text"]["value"]
        else:
            columns_string = value["elements"]["columns"]["value"]
            column_headers = columns_string.split(",")
            column_headers.insert(0, "Type")

            csv_data = value["elements"]["csv_data"]["value"].split("\n")
            for data in csv_data:
                row_data.append(next(csv.reader(StringIO(data))))

    filepath = os.path.join(kontent_service_folder, "usaid_s_surviving_programs.csv")
    write_csv(filepath, column_headers, row_data)





async def process_vital_health_services_disrupted():
    kontent_service_folder = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(kontent_service_folder, exist_ok=True)

    page_data = await fetch_kontent_data(item_id="vital_health_services_disrupted")

    title = page_data["item"]["elements"]["section_title"]["value"]
    pie_chart_data = page_data["item"]["elements"]["pie_chart_data"]["value"]
    radar_chart_data = page_data["item"]["elements"]["radar_chart_data"]["value"]

    modular_content = page_data["modular_content"]

    data = {}

    for key, value in modular_content.items():
        if key in pie_chart_data:
            data[key] = {
                "title": value["elements"]["title"]["value"],
                "text": value["elements"]["text"]["value"],
                "data": value["elements"]["data"]["value"].split("\n"),
                "total_countries": value["elements"]["total_countries"]["value"],
            }
        else:
            data[key] = {
                "title": value["elements"]["title"]["value"],
                "text": value["elements"]["text"]["value"],
                "data": value["elements"]["data"]["value"].split("\n"),
                "total_countries": value["elements"]["total_countries"]["value"],
                "legend_text": value["elements"]["legend_text"]["value"],
                "blue_box_text": value["elements"]["blue_box_text"]["value"],
            }

    with open(
        os.path.join(kontent_service_folder, "vital_health_services_disrupted.json"),
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
