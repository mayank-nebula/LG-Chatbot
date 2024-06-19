items = client.sites[site_id].lists[d_list_id].items.expand(["fields"]).get().top(10).execute_query()
