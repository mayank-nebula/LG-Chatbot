import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Fetch your data from your Headless WordPress API here.
  const videos = [
    {
      pageUrl: 'https://letstalksupplychain.com/podcasts/episode-529',
      title: 'Episode 529: Empower the People Who Power the World',
      description: 'A great discussion about supply chain and technology.',
      uploadDate: '2023-10-25T12:00:00+00:00',
      
      // --- YOUTUBE SPECIFIC ---
      youtubeId: 'dQw4w9WgXcQ', // Just the ID!
      mp4Url: null, 
      
      featuredMediaUrl: 'https://letstalksupplychain.com/wp-content/uploads/2023/10/ep529.jpg',
    },
    {
      pageUrl: 'https://letstalksupplychain.com/podcasts/episode-530',
      title: 'Episode 530: The Future of Logistics',
      description: 'Exploring upcoming trends in global logistics.',
      uploadDate: '2023-11-01T12:00:00+00:00',
      
      // --- MP4 SPECIFIC ---
      youtubeId: null, 
      mp4Url: 'https://letstalksupplychain.com/wp-content/uploads/2023/11/logistics-video.mp4',
      
      featuredMediaUrl: 'https://letstalksupplychain.com/wp-content/uploads/2023/11/ep530-featured.jpg',
    },
  ];

  // 2. Build the XML structure
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
          xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    ${videos
      .map((video) => {
        let thumbnailUrl = '';
        let videoLocationTag = '';

        // Check if we have a YouTube ID
        if (video.youtubeId) {
          
          // 1. Automatically generate the YouTube thumbnail using the ID
          thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
          
          // 2. Create the proper YouTube embed URL for Google
          videoLocationTag = `<video:player_loc>https://www.youtube.com/embed/${video.youtubeId}</video:player_loc>`;
          
        } 
        // Otherwise, check if we have an MP4 URL
        else if (video.mp4Url) {
          
          // 1. Use the WordPress Featured Image
          thumbnailUrl = video.featuredMediaUrl || '';
          
          // 2. Provide the direct link to the MP4 file
          videoLocationTag = `<video:content_loc><![CDATA[${video.mp4Url}]]></video:content_loc>`;
          
        } 
        // If neither exists, skip this entry
        else {
          return '';
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
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate',
    },
  });
}
