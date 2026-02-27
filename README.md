[
  {
    "post_id": 32,
    "post": {
      "ID": 32,
      "post_author": "1",
      "post_date": "2026-02-27 03:38:25",
      "post_date_gmt": "2026-02-27 03:38:25",
      "post_content": "<!-- wp:paragraph -->\n<p>Testing Webhook</p>\n<!-- /wp:paragraph -->",
      "post_title": "Testing Webhook",
      "post_excerpt": "",
      "post_status": "publish",
      "comment_status": "open",
      "ping_status": "open",
      "post_password": "",
      "post_name": "testing-webhook",
      "to_ping": "",
      "pinged": "",
      "post_modified": "2026-02-27 03:38:25",
      "post_modified_gmt": "2026-02-27 03:38:25",
      "post_content_filtered": "",
      "post_parent": 0,
      "guid": "http://test.local/?p=32",
      "menu_order": 0,
      "post_type": "post",
      "post_mime_type": "",
      "comment_count": "0",
      "filter": "raw"
    },
    "post_meta": {
      "_edit_lock": ["1772163503:1"],
      "wpwhpro_create_post_temp_status_send_data_create": ["auto-draft"],
      "_pingme": ["1"],
      "_encloseme": ["1"]
    },
    "post_thumbnail": false,
    "post_permalink": "http://test.local/testing-webhook/",
    "taxonomies": {
      "category": {
        "uncategorized": {
          "term_id": 1,
          "name": "Uncategorized",
          "slug": "uncategorized",
          "term_group": 0,
          "term_taxonomy_id": 1,
          "taxonomy": "category",
          "description": "",
          "parent": 0,
          "count": 1,
          "filter": "raw"
        }
      }
    },
    "acf_data": false
  }
]


from fastapi import FastAPI, Request

app = FastAPI()


@app.post("/webhook/publish")
async def on_post_publish(request: Request):
    data = await request.json()
    print(data)
    post_id = data.get("post_id")

    print(f"Post Published/Updated - ID: {post_id}")

    return {"status": "success", "event": "publish", "post_id": post_id}


@app.post("/webhook/delete")
async def on_post_delete(request: Request):
    data = await request.json()
    post_id = data.get("post_id")

    print(f"Post Deleted - ID: {post_id}")

    return {"status": "success", "event": "delete", "post_id": post_id}
