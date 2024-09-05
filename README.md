if pd.isna(permissions_str) or permissions_str.strip() == "":
            permissions_list = []  # Handle missing or empty permission string
        else:
            # If the permission string contains a ';', split it, otherwise just create a list with the single value
            if ";" in permissions_str:
                permissions_list = permissions_str.split(";")  # Split by ';' to create a list
            else:
                permissions_list = [permissions_str]
