def save_to_csv1(data, csv_filename, field_names):
    if data:
        with open(csv_filename, newline="", mode="w", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=field_names)
            writer.writeheader()
            writer.writerows(data)
        logging.info(f"CSV file {csv_filename} created.")
