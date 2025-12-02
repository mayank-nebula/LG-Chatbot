export async function fetchPlaylistVideos(
  playlistId: string,
  pageToken?: string,
  limit: number = 10
) {
  const key = process.env.YOUTUBE_API_KEY!;

  let url =
    "https://www.googleapis.com/youtube/v3/playlistItems" +
    `?part=snippet&maxResults=${limit}&playlistId=${playlistId}&key=${key}&order=viewCount`;

  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("YouTube API error");

  const data = await res.json();

  return {
    items: data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
}
