// app/api/youtube/streams/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Video {
  video_id: string;
  title: string;
  upload_date: string;
  views: number;
}

interface PaginationData {
  hasMore: boolean;
  nextPageToken: string | null;
}

interface ApiResponse {
  success: boolean;
  data: Video[];
  pagination: PaginationData;
  error?: string;
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing YouTube API credentials',
          data: [],
          pagination: { hasMore: false, nextPageToken: null }
        } as ApiResponse,
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const pageToken = searchParams.get('pageToken');

    // Fetch one batch of streams (10 videos)
    const result = await fetchStreamBatch(pageToken);

    // Sort: live first, then upcoming (closest first), then past broadcasts (newest first)
    const sortedStreams = sortStreamsByPriority(result.items);

    // Format response
    const response: ApiResponse = {
      success: true,
      data: sortedStreams.map(formatVideoResponse),
      pagination: {
        hasMore: !!result.nextPageToken,
        nextPageToken: result.nextPageToken
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360'
      }
    });

  } catch (error) {
    console.error('YouTube API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        data: [],
        pagination: { hasMore: false, nextPageToken: null }
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function fetchStreamBatch(pageToken: string | null) {
  // Use search API to get videos from the channel
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.append('part', 'snippet');
  searchUrl.searchParams.append('channelId', YOUTUBE_CHANNEL_ID!);
  searchUrl.searchParams.append('type', 'video');
  searchUrl.searchParams.append('order', 'date');
  searchUrl.searchParams.append('maxResults', '10');
  searchUrl.searchParams.append('key', YOUTUBE_API_KEY!);
  
  if (pageToken) {
    searchUrl.searchParams.append('pageToken', pageToken);
  }

  const searchResponse = await fetch(searchUrl.toString());
  
  if (!searchResponse.ok) {
    const errorData = await searchResponse.json().catch(() => ({}));
    throw new Error(`YouTube API error: ${searchResponse.statusText} - ${JSON.stringify(errorData)}`);
  }

  const searchData = await searchResponse.json();

  // Get video IDs
  const videoIds = searchData.items.map((item: any) => item.id.videoId);

  if (videoIds.length === 0) {
    return {
      items: [],
      nextPageToken: null
    };
  }

  // Fetch detailed video information to get live status and statistics
  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.append('part', 'snippet,statistics,liveStreamingDetails');
  videosUrl.searchParams.append('id', videoIds.join(','));
  videosUrl.searchParams.append('key', YOUTUBE_API_KEY!);

  const videosResponse = await fetch(videosUrl.toString());
  
  if (!videosResponse.ok) {
    const errorData = await videosResponse.json().catch(() => ({}));
    throw new Error(`YouTube API error: ${videosResponse.statusText} - ${JSON.stringify(errorData)}`);
  }

  const videosData = await videosResponse.json();

  // Filter only videos that were/are/will be live streams
  // Check if video has liveStreamingDetails or liveBroadcastContent is not 'none'
  const liveVideos = videosData.items.filter((video: any) => {
    const liveBroadcastContent = video.snippet.liveBroadcastContent;
    return liveBroadcastContent === 'live' || 
           liveBroadcastContent === 'upcoming' || 
           video.liveStreamingDetails; // Has live streaming details (past broadcasts)
  });

  return {
    items: liveVideos,
    nextPageToken: searchData.nextPageToken || null
  };
}

function sortStreamsByPriority(videos: any[]): any[] {
  const liveVideos: any[] = [];
  const upcomingVideos: any[] = [];
  const completedVideos: any[] = [];

  videos.forEach(video => {
    const liveStatus = video.snippet.liveBroadcastContent;
    
    if (liveStatus === 'live') {
      liveVideos.push(video);
    } else if (liveStatus === 'upcoming') {
      upcomingVideos.push(video);
    } else {
      // Past broadcasts (completed streams)
      completedVideos.push(video);
    }
  });

  // Sort upcoming videos by scheduled start time (closest first)
  upcomingVideos.sort((a, b) => {
    const timeA = a.liveStreamingDetails?.scheduledStartTime || a.snippet.publishedAt;
    const timeB = b.liveStreamingDetails?.scheduledStartTime || b.snippet.publishedAt;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  // Sort completed videos by actual start time or published date (newest first)
  completedVideos.sort((a, b) => {
    const timeA = a.liveStreamingDetails?.actualStartTime || a.snippet.publishedAt;
    const timeB = b.liveStreamingDetails?.actualStartTime || b.snippet.publishedAt;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  // Combine: live first, then upcoming, then completed
  return [...liveVideos, ...upcomingVideos, ...completedVideos];
}

function formatVideoResponse(video: any): Video {
  return {
    video_id: video.id,
    title: video.snippet.title,
    upload_date: video.snippet.publishedAt,
    views: parseInt(video.statistics?.viewCount || '0')
  };
}

export const config = {
  runtime: 'nodejs',
};
