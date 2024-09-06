failed_files_csv = pd.read_csv('failed_files.csv')
        deliverables_list_csv = pd.read_csv("deliverables_list.csv")
        name_set = set(failed_files_csv['Name'].astype(str))
        deliverables_list_filtered_csv = deliverables_list_csv[~deliverables_list_csv['FileLeafRef'].astype(str).isin(name_set)]
