// app/api/youtube/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Types
interface YouTubeVideo {
  video_id: string;
  title: string;
  published_at: string;
  live_status: 'live' | 'upcoming' | 'none';
  duration: string;
}

interface PaginationMeta {
  hasMore: boolean;
  nextPageToken: string | null;
  totalResults: number;
}

interface APIResponse {
  success: boolean;
  data: YouTubeVideo[];
  pagination: PaginationMeta;
  error?: string;
}

// Helper function to parse ISO 8601 duration
function parseISO8601Duration(duration: string): number {
  if (!duration || duration === 'PT0S') return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to check if video is a Short
function isShort(duration: string): boolean {
  const totalSeconds = parseISO8601Duration(duration);
  return totalSeconds > 0 && totalSeconds <= 60;
}

// Main API Route Handler
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');
    const pageToken = searchParams.get('pageToken');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validation
    if (!channelId) {
      return NextResponse.json(
        {
          success: false,
          error: 'channelId is required',
        } as APIResponse,
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'limit must be between 1 and 50',
        } as APIResponse,
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube API key not configured',
        } as APIResponse,
        { status: 500 }
      );
    }

    // Step 1: Get uploads playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
        new URLSearchParams({
          part: 'contentDetails',
          id: channelId,
          key: apiKey,
        })
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Channel not found',
        } as APIResponse,
        { status: 404 }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Step 2: Get playlist items (we'll fetch more to filter out shorts)
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?` +
        new URLSearchParams({
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: '50', // Fetch more to account for shorts filtering
          ...(pageToken && { pageToken }),
          key: apiKey,
        })
    );

    if (!playlistResponse.ok) {
      throw new Error(`YouTube API error: ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          hasMore: false,
          nextPageToken: null,
          totalResults: 0,
        },
      } as APIResponse);
    }

    // Step 3: Get detailed video information
    const videoIds = playlistData.items.map(
      (item: any) => item.contentDetails.videoId
    );

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
        new URLSearchParams({
          part: 'snippet,contentDetails,liveStreamingDetails',
          id: videoIds.join(','),
          key: apiKey,
        })
    );

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();

    // Step 4: Process and filter videos
    const videos: YouTubeVideo[] = videosData.items
      .filter((item: any) => {
        // Filter out shorts
        const duration = item.contentDetails.duration;
        return !isShort(duration);
      })
      .map((item: any) => ({
        video_id: item.id,
        title: item.snippet.title,
        published_at: item.snippet.publishedAt,
        live_status: item.snippet.liveBroadcastContent,
        duration: item.contentDetails.duration,
      }));

    // Step 5: Sort by latest date (published_at)
    videos.sort((a, b) => {
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    // Step 6: Apply limit and prepare pagination
    const paginatedVideos = videos.slice(0, limit);
    const hasMore = videos.length > limit || !!playlistData.nextPageToken;

    return NextResponse.json({
      success: true,
      data: paginatedVideos,
      pagination: {
        hasMore,
        nextPageToken: playlistData.nextPageToken || null,
        totalResults: paginatedVideos.length,
      },
    } as APIResponse);

  } catch (error) {
    console.error('YouTube API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as APIResponse,
      { status: 500 }
    );
  }
}

// Optional: Add rate limiting and caching
export const runtime = 'edge'; // Optional: Use edge runtime for better performance
export const dynamic = 'force-dynamic'; // Disable caching for fresh data
