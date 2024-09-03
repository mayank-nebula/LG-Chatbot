users_list_items = [item.to_json()["fields"] for item in users_list_object]
        users_list_csv_filename = os.path.join(os.getcwd(), "users_permission.csv")
        save_to_csv(
            users_list_items,
            users_list_csv_filename,
            additional_folders=[express_folder, fast_folder],
        )

        df = pd.read_csv("users_permission.csv")
        df["Permissions"] = df["Teams"].astype(str) + df["TeamsPermission"].astype(str)

        result = (
            df.groupby(["User", "UserLookupId"])["Permissions"]
            .apply(lambda x: ";".join(x))
            .reset_index()
        )
        result.columns = ["Name", "UserLookupId", "Permissions"]
        result.to_csv("users_permission.csv", index=False)
