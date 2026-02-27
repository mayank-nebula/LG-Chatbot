import { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cart",
        "/thank-you",
        "/admin",

        "/landing-page-v1",
        "/test",
        "/slider-demo",
        "/work-with-us-3/",
        "/work-with-us-2/",
        "/practice-page/",
        "/media-kit",
        "/media-kit-full",
        "/mediakit",
      ],
    },
    // Keep this out of the sitemap by simply not adding those URLs to your sitemap generator
    sitemap: `${env.PUBLIC_SITE_URL}/sitemap.xml`,
  };
}

Disallow: /landing-page-v1
Disallow: /test
Disallow: /slider-demo
Disallow: /work-with-us-3/
Disallow: /work-with-us-2/
Disallow: /practice-page/
Disallow: /media-kit
Disallow: /media-kit-full
Disallow: /mediakit
 
ye vale txt main nahi, meta robots main noindex no follow krna tha
 
baki Monday krte hain
 
