import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // 1. Add your current site's disallowed paths here
        '/cart', 
        '/thank-you',
        '/admin',
        
        // 2. The 9 specific URLs requested to be hidden
        '/landing-page-v1',
        '/test',
        '/slider-demo',
        '/work-with-us-3/',
        '/work-with-us-2/',
        '/practice-page/',
        '/media-kit',
        '/media-kit-full',
        '/mediakit'
      ],
    },
    // Keep this out of the sitemap by simply not adding those URLs to your sitemap generator
    sitemap: 'https://letstalksupplychain.com/sitemap.xml',
  }
}
