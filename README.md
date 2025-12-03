import requests
from datetime import datetime

class YouTubeChannelFetcher:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://www.googleapis.com/youtube/v3"
    
    def get_channel_id(self, channel_handle):
        """Get channel ID from handle or username"""
        url = f"{self.base_url}/channels"
        params = {
            'part': 'id',
            'forHandle': channel_handle.replace('@', ''),
            'key': self.api_key
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            return data['items'][0]['id']
        return None
    
    def get_uploads_playlist_id(self, channel_id):
        """Get the uploads playlist ID for a channel"""
        url = f"{self.base_url}/channels"
        params = {
            'part': 'contentDetails',
            'id': channel_id,
            'key': self.api_key
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            return data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        return None
    
    def get_all_videos(self, channel_id, exclude_shorts=True):
        """Fetch all videos from a channel (live, upcoming, and uploaded)"""
        all_videos = []
        
        # Get uploads playlist
        uploads_playlist_id = self.get_uploads_playlist_id(channel_id)
        if not uploads_playlist_id:
            print("Could not find uploads playlist")
            return all_videos
        
        # Fetch all videos from uploads playlist
        next_page_token = None
        while True:
            url = f"{self.base_url}/playlistItems"
            params = {
                'part': 'snippet,contentDetails',
                'playlistId': uploads_playlist_id,
                'maxResults': 50,
                'key': self.api_key
            }
            if next_page_token:
                params['pageToken'] = next_page_token
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if 'items' not in data:
                break
            
            video_ids = [item['contentDetails']['videoId'] for item in data['items']]
            
            # Get detailed video info to filter shorts and check live status
            video_details = self.get_video_details(video_ids)
            
            for video in video_details:
                # Filter out Shorts (videos with duration < 61 seconds and vertical aspect ratio)
                if exclude_shorts:
                    duration = video.get('duration', '')
                    # Parse ISO 8601 duration
                    if self.is_short_video(duration):
                        continue
                
                all_videos.append({
                    'video_id': video['id'],
                    'title': video['title'],
                    'published_at': video['published_at'],
                    'live_status': video['live_status'],
                    'duration': video['duration'],
                    'url': f"https://www.youtube.com/watch?v={video['id']}"
                })
            
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
        
        return all_videos
    
    def get_video_details(self, video_ids):
        """Get detailed information for multiple videos"""
        url = f"{self.base_url}/videos"
        params = {
            'part': 'snippet,contentDetails,liveStreamingDetails',
            'id': ','.join(video_ids),
            'key': self.api_key
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        videos = []
        if 'items' in data:
            for item in data['items']:
                videos.append({
                    'id': item['id'],
                    'title': item['snippet']['title'],
                    'published_at': item['snippet']['publishedAt'],
                    'duration': item['contentDetails']['duration'],
                    'live_status': item['snippet'].get('liveBroadcastContent', 'none')
                })
        
        return videos
    
    def is_short_video(self, duration):
        """Check if video is a Short based on duration (< 61 seconds)"""
        # Parse ISO 8601 duration format (e.g., PT1M30S, PT45S)
        if not duration or duration == 'PT0S':
            return False
        
        import re
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
        if not match:
            return False
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        total_seconds = hours * 3600 + minutes * 60 + seconds
        return total_seconds <= 60

# Usage Example
if __name__ == "__main__":
    API_KEY = "YOUR_API_KEY_HERE"
    CHANNEL_ID = "YOUR_CHANNEL_ID_HERE"  # e.g., "UC_x5XG1OV2P6uZZ5FSM9Ttw"
    
    fetcher = YouTubeChannelFetcher(API_KEY)
    
    print(f"Fetching videos for channel: {CHANNEL_ID}")
    videos = fetcher.get_all_videos(CHANNEL_ID, exclude_shorts=True)
    
    # Separate by status
    live_videos = [v for v in videos if v['live_status'] == 'live']
    upcoming_videos = [v for v in videos if v['live_status'] == 'upcoming']
    uploaded_videos = [v for v in videos if v['live_status'] == 'none']
    
    print(f"\nTotal videos: {len(videos)}")
    print(f"Live: {len(live_videos)}")
    print(f"Upcoming: {len(upcoming_videos)}")
    print(f"Uploaded: {len(uploaded_videos)}")
    
    # Display sample videos from each category
    if live_videos:
        print("\n=== LIVE VIDEOS ===")
        for video in live_videos[:3]:
            print(f"{video['title']}")
            print(f"  URL: {video['url']}\n")
    
    if upcoming_videos:
        print("\n=== UPCOMING VIDEOS ===")
        for video in upcoming_videos[:3]:
            print(f"{video['title']}")
            print(f"  URL: {video['url']}\n")
    
    if uploaded_videos:
        print("\n=== UPLOADED VIDEOS (Sample) ===")
        for video in uploaded_videos[:5]:
            print(f"{video['title']}")
            print(f"  URL: {video['url']}\n")
