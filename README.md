import { NextResponse } from 'next/server';

// Helper function to extract YouTube ID from any YouTube URL format
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
  return match ? match[1] : null;
}

export async function GET() {
  // 1. Fetch your data from your Headless WordPress API here.
  // This is mock data simulating what your API returns.
  const videos = [
    {
      pageUrl: 'https://letstalksupplychain.com/podcasts/episode-529',
      title: 'Episode 529: Empower the People Who Power the World',
      description: 'A great discussion about supply chain and technology.',
      uploadDate: '2023-10-25T12:00:00+00:00',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // YouTube link
      featuredMediaUrl: 'https://letstalksupplychain.com/wp-content/uploads/2023/10/ep529.jpg', // WP Image (ignored for YT)
    },
    {
      pageUrl: 'https://letstalksupplychain.com/podcasts/episode-530',
      title: 'Episode 530: The Future of Logistics',
      description: 'Exploring upcoming trends in global logistics.',
      uploadDate: '2023-11-01T12:00:00+00:00',
      videoUrl: 'https://letstalksupplychain.com/wp-content/uploads/2023/11/logistics-video.mp4', // MP4 link
      featuredMediaUrl: 'https://letstalksupplychain.com/wp-content/uploads/2023/11/ep530-featured.jpg', // WP Image (Used for MP4)
    },
  ];

  // 2. Build the XML structure
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
          xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    ${videos
      .map((video) => {
        // Determine if the video is YouTube or MP4
        const isYouTube = video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be');
        
        let thumbnailUrl = '';
        let videoLocationTag = '';

        if (isYouTube) {
          // --- YOUTUBE LOGIC ---
          const ytId = getYouTubeId(video.videoUrl);
          
          // 1. Use Auto-generated YouTube thumbnail
          thumbnailUrl = ytId 
            ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
            : video.featuredMediaUrl; // fallback just in case
            
          // 2. Use player_loc with the proper embed URL
          videoLocationTag = ytId 
            ? `<video:player_loc>https://www.youtube.com/embed/${ytId}</video:player_loc>`
            : `<video:player_loc><![CDATA[${video.videoUrl}]]></video:player_loc>`;
            
        } else {
          // --- MP4 / SELF-HOSTED LOGIC ---
          // 1. Use WordPress featured media for thumbnail
          thumbnailUrl = video.featuredMediaUrl || '';
          
          // 2. Use content_loc for direct mp4 files
          videoLocationTag = `<video:content_loc><![CDATA[${video.videoUrl}]]></video:content_loc>`;
        }

        // Return the XML block for this specific video
        return `
      <url>
        <loc><![CDATA[${video.pageUrl}]]></loc>
        <video:video>
          <video:thumbnail_loc><![CDATA[${thumbnailUrl}]]></video:thumbnail_loc>
          <video:title><![CDATA[${video.title}]]></video:title>
          <video:description><![CDATA[${video.description}]]></video:description>
          <video:publication_date>${video.uploadDate}</video:publication_date>
          ${videoLocationTag}
        </video:video>
      </url>`;
      })
      .join('')}
  </urlset>`;

  // 3. Return the properly formatted XML response
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml',
      // Optional: Add caching to prevent your DB from being hit every time Google crawls
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate',
    },
  });
}
