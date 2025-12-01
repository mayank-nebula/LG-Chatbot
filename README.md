from googleapiclient.discovery import build

API_KEY = "YOUR_API_KEY"
CHANNEL_ID = "UCxxxxxxxxxxxxxxxx"   # Replace with the channel's ID

youtube = build("youtube", "v3", developerKey=API_KEY)

playlists = []
request = youtube.playlists().list(
    part="snippet",
    channelId=CHANNEL_ID,
    maxResults=50
)

# Handle pagination
while request:
    response = request.execute()

    for item in response.get("items", []):
        playlist_id = item["id"]
        playlist_title = item["snippet"]["title"]
        playlists.append((playlist_id, playlist_title))

        print(f"{playlist_id}  -->  {playlist_title}")

    request = youtube.playlists().list_next(request, response)
