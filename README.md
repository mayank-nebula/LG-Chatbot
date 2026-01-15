import { NextResponse } from "next/server";

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

function findSlidesWidgets(node: any, widgets: any[] = []) {
  if (node?.properties?.data-widget_type === "slides.default") {
    widgets.push(node);
  }

  if (Array.isArray(node?.children)) {
    for (const child of node.children) {
      findSlidesWidgets(child, widgets);
    }
  }

  return widgets;
}

function extractSlides(slider: any) {
  const slides: any[] = [];

  function walk(node: any) {
    const classes = node?.properties?.class || [];

    const repeater = Array.isArray(classes)
      ? classes.find((c: string) =>
          c.startsWith("elementor-repeater-item-")
        )
      : null;

    if (repeater) {
      let link = null;
      let aria_label = null;

      for (const child of node.children || []) {
        if (child.tag === "a") {
          link = child.properties?.href || null;
        }
        if (child.tag === "div") {
          aria_label = child.properties?.aria-label || null;
        }
      }

      slides.push({ repeater, link, aria_label });
    }

    for (const child of node.children || []) {
      walk(child);
    }
  }

  walk(slider);
  return slides;
}

function extractBackgroundImages(css: string) {
  const images: Record<string, string> = {};
  const regex =
    /\.((?:elementor-repeater-item-[a-zA-Z0-9]+))[^}]*background-image\s*:\s*url\((['"]?)(.*?)\2\)/gs;

  let match;
  while ((match = regex.exec(css)) !== null) {
    images[match[1]] = match[3];
  }

  return images;
}

export async function GET() {
  try {
    // 1️⃣ Fetch page HTML structure (cached 1 hr)
    const pageRes = await fetch(PAGE_API, {
      next: { revalidate: 3600 },
    });
    const page = await pageRes.json();

    if (!page?.content?.rendered) {
      return NextResponse.json({ banners: [] });
    }

    // 2️⃣ Parse HTML via DOMParser (Edge-safe)
    const dom = new (require("jsdom").JSDOM)(page.content.rendered);
    const body = dom.window.document.body;

    // Convert DOM → JSON-like structure
    function domToJson(el: any): any {
      if (el.nodeType === 3) return null;

      return {
        tag: el.tagName?.toLowerCase(),
        properties: {
          class: el.className?.split(" "),
          ...Array.from(el.attributes || []).reduce(
            (acc: any, a: any) => ({ ...acc, [a.name]: a.value }),
            {}
          ),
        },
        children: Array.from(el.children || []).map(domToJson),
      };
    }

    const tree = domToJson(body);

    // 3️⃣ Find slides widgets
    const sliders = findSlidesWidgets(tree);

    // 4️⃣ Extract slides
    const slides = sliders.flatMap(extractSlides);

    // 5️⃣ Fetch Elementor CSS (cached 1 hr)
    const cssRes = await fetch(CSS_URL, {
      next: { revalidate: 3600 },
    });
    const cssText = await cssRes.text();
    const bgImages = extractBackgroundImages(cssText);

    // 6️⃣ Build banners
    const banners: Banner[] = slides.map((s) => ({
      repeater_id: s.repeater,
      image: bgImages[s.repeater] || null,
      link: s.link,
      aria_label: s.aria_label,
    }));

    return NextResponse.json(
      { banners },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}
