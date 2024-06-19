Team, I have uploaded the python file to download SharePoint files. It is available in "Files". Currently it is set to download from top 10 folders only, to change this replace the top value in below query to "5000" .

folder_items = client.sites[site_id].drives[drive_id].items[parent_id].children.get().top(10).execute_query()

