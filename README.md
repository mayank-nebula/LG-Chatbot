Hi,

Our frontend is built with Next.js and uses WordPress as a headless CMS. All page content is sourced from the WordPress REST API.

The site uses **Static Site Generation (SSG) with Incremental Static Regeneration (ISR)** along with the **built-in Next.js caching mechanism**. Pages are generated statically and cached with a **revalidation period of 1 hour**.

This means the WordPress API is not called on every page load. Instead, the cached static page is served to users. After the 1-hour revalidation window, the next request triggers a background regeneration, which fetches the latest content from WordPress and updates the cached page for subsequent visitors.

Media assets such as images are requested directly from the WordPress media URLs when users visit the page. These assets can be cached at the **browser or CDN level depending on the infrastructure configuration**, which would further reduce repeated requests to the origin server.

Overall, the page HTML is served from the Next.js cache, which helps minimize repeated requests to the WordPress API and keeps the overall server load low.

Please let me know if you need any further technical details.

Best regards,
