def process_global_health_funding():
    url = f"{BASE_URL}/{ENVIRONMENT_ID}/items/global_health_funding_page"
    resp = requests.get(url, headers=headers)
    data = resp.json()

    kontent_service_folder = os.path.join(os.getcwd(), "kontent_service")
    os.makedirs(kontent_service_folder, exist_ok=True)

    global_health_funding_page_folder = os.path.join(
        kontent_service_folder, "global_health_funding_page"
    )
    os.makedirs(global_health_funding_page_folder, exist_ok=True)

    title = data["item"]["elements"]["title"]["value"]
    sub_title = data["item"]["elements"]["sub_title"]["value"]
    map_data_source = data["item"]["elements"]["map_data_source"]["value"]
    top_10_countries_title = data["item"]["elements"]["top_10_countries_title"]["value"]

    modular_content = data["modular_content"]

    oda_header = ["Country", "Country Code", "Year", "Overall ODA Value"]
    row_oda_data = []

    global_health_funding_header = [
        "Country",
        "Country Code",
        "Year",
        "Sector",
        "Sub Sector",
        "Value",
    ]
    global_health_funding_row_data = []

    for content_key, content_value in modular_content.items():
        country = content_value["elements"]["country_name"]["value"]
        country_code = content_value["elements"]["country_code"]["value"]

        sector_data = content_value["elements"]["sector_data"]["value"]
        overall_oda = content_value["elements"]["overall_oda"]["value"]

        url_main = f"{BASE_URL}/{ENVIRONMENT_ID}/items/{overall_oda[0]}"
        resp_main = requests.get(url_main, headers=headers)
        data_oda = resp_main.json()

        modular_content_oda = data_oda["modular_content"]

        for (
            modular_content_oda_key,
            modular_content_oda_value,
        ) in modular_content_oda.items():
            modular_content_oda_year = modular_content_oda_value["elements"]["year"][
                "value"
            ][0]["name"]
            modular_content_oda_value = modular_content_oda_value["elements"]["value"][
                "value"
            ]

            row_oda_data.append(
                [
                    country,
                    country_code,
                    modular_content_oda_year,
                    modular_content_oda_value,
                ]
            )

        for sector_data_indi in sector_data:
            url_sector_data = f"{BASE_URL}/{ENVIRONMENT_ID}/items/{sector_data_indi}"
            resp_sector_data = requests.get(url_sector_data, headers=headers)
            data_sector_data = resp_sector_data.json()

            modular_content_sector_data = data_sector_data["modular_content"]

            for (
                modular_content_sector_data_key,
                modular_content_sector_data_value,
            ) in modular_content_sector_data.items():

                sector_name = modular_content_sector_data_value["elements"]["sector"][
                    "value"
                ][0]["name"]
                sub_sector = modular_content_sector_data_value["elements"][
                    "sub_sector"
                ]["value"]

            for sub_sector_indi in sub_sector:
                url_sub_sector_indi = (
                    f"{BASE_URL}/{ENVIRONMENT_ID}/items/{sub_sector_indi}"
                )
                resp_sub_sector_indi = requests.get(
                    url_sub_sector_indi, headers=headers
                )
                data_sub_sector_indi = resp_sub_sector_indi.json()

                data_sub_sector_indi_modular_content = data_sub_sector_indi[
                    "modular_content"
                ]

                for (
                    data_sub_sector_indi_modular_content_key,
                    data_sub_sector_indi_modular_content_value,
                ) in data_sub_sector_indi_modular_content.items():

                    data_sub_sector_indi_modular_content_value_name = (
                        data_sub_sector_indi_modular_content_value["system"]["name"]
                    )
                    data_sub_sector_indi_modular_content_value_year = (
                        data_sub_sector_indi_modular_content_value["elements"]["year"][
                            "value"
                        ][0]["name"]
                    )
                    data_sub_sector_indi_modular_content_value_value = (
                        data_sub_sector_indi_modular_content_value["elements"]["value"][
                            "value"
                        ]
                    )

                    data_to_append = [
                        country,
                        country_code,
                        data_sub_sector_indi_modular_content_value_year,
                        sector_name,
                        data_sub_sector_indi_modular_content_value_name.replace(
                            country, ""
                        )
                        .replace(data_sub_sector_indi_modular_content_value_year, "")
                        .strip(),
                        data_sub_sector_indi_modular_content_value_value,
                    ]

                    global_health_funding_row_data.append(data_to_append)

    with open(
        os.path.join(
            global_health_funding_page_folder,
            "overall_oda.csv",
        ),
        "w",
        newline="",
        encoding="utf-8",
    ) as f:
        writer = csv.writer(f)
        writer.writerow(oda_header)
        writer.writerows(row_oda_data)

    with open(
        os.path.join(
            global_health_funding_page_folder,
            "global_health_funding.csv",
        ),
        "w",
        newline="",
        encoding="utf-8",
    ) as f:
        writer = csv.writer(f)
        writer.writerow(global_health_funding_header)
        writer.writerows(global_health_funding_row_data)
