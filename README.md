def get_last_run_timestamp():
    if os.path.exists(TIMESTAMP_FILE):
        with open(TIMESTAMP_FILE, "r") as file:
            return datetime.fromisoformat(json.load(file)["last_run"])
    else:
        return None


def update_last_run_timestamp():
    with open(TIMESTAMP_FILE, "w") as file:
        json.dump({"last_run": datetime.now().isoformat()}, file)
    logging.info("Last run timestamp updated.")
