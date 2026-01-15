import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const SITE_URL = "https://letstalksupplychain.com";
const PAGE_ID = 23319;

const PAGE_API = `${SITE_URL}/wp-json/wp/v2/pages/${PAGE_ID}`;
const CSS_URL = `${SITE_URL}/wp-content/uploads/elementor/css/post-${PAGE_ID}.css`;

type Banner = {
  repeater_id: string;
  image: string | null;
  link: string | null;
  aria_label: string | null;
};

/**
 * Extracts background images from Elementor's generated CSS file
 */
function extractBackgroundImages(css: string): Record<string, string> {
  const images: Record<string, string> = {};
  // Improved Regex to capture the repeater ID and the URL correctly
  const regex = /\.elementor-repeater-item-([a-zA-Z0-9]+)\s*\{[^}]*background-image:\s*url\((['"]?)(.*?)\2\)/gi;

  let match;
  while ((match = regex.exec(css)) !== null) {
    const id = match[1];
    const url = match[3];
    images[`elementor-repeater-item-${id}`] = url;
  }

  return images;
}

export async function GET() {
  try {
    // 1. Fetch page data from WP API
    const pageRes = await fetch(PAGE_API, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!pageRes.ok) throw new Error("Failed to fetch page data");
    
    const page = await pageRes.json();
    const html = page?.content?.rendered;

    if (!html) {
      return NextResponse.json({ banners: [] });
    }

    // 2. Load HTML into Cheerio
    const $ = cheerio.load(html);
    const slidesData: Omit<Banner, "image">[] = [];

    // 3. Find all Elementor Slides widgets
    // We look for the specific repeater items inside slide widgets
    $('[class*="elementor-repeater-item-"]').each((_, el) => {
      const $el = $(el);
      
      // Extract the specific repeater class (e.g., elementor-repeater-item-12345)
      const className = $el.attr("class") || "";
      const match = className.match(/elementor-repeater-item-[a-zA-Z0-9]+/);
      
      if (match) {
        const repeater_id = match[0];
        
        // Find link: Elementor usually puts it in an <a> tag inside or uses the element itself
        const link = $el.find("a").attr("href") || $el.attr("href") || null;
        
        // Find aria-label: check common locations in Elementor slides
        const aria_label = 
            $el.find(".elementor-slide-heading").text().trim() || 
            $el.attr("aria-label") || 
            null;

        slidesData.push({ repeater_id, link, aria_label });
      }
    });

    // 4. Fetch Elementor CSS to get background images
    const cssRes = await fetch(CSS_URL, {
      next: { revalidate: 3600 },
    });
    
    let bgImages: Record<string, string> = {};
    if (cssRes.ok) {
      const cssText = await cssRes.text();
      bgImages = extractBackgroundImages(cssText);
    }

    // 5. Combine HTML data with CSS images
    const banners: Banner[] = slidesData.map((s) => ({
      ...s,
      image: bgImages[s.repeater_id] || null,
    }));

    // Filter out duplicates (Elementor sometimes renders items twice for swiper loops)
    const uniqueBanners = Array.from(new Map(banners.map(item => [item.repeater_id, item])).values());

    return NextResponse.json(
      { banners: uniqueBanners },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (err: any) {
    console.error("Banner Fetch Error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch banners", details: err.message },
      { status: 500 }
    );
  }
}
