type Banner = {
  repeater_id: string;
  image: string | null;
  link: string | null;
  aria_label: string | null;
};

function extractBackgroundImages(css: string): Record<string, string> {
  const images: Record<string, string> = {};
  const regex =
    /\.(elementor-repeater-item-[a-zA-Z0-9]+)[^{]*\{[^}]*background-image\s*:\s*url\((['"]?)([\s\S]*?)\2\)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(css)) !== null) {
    images[match[1]] = match[3];
  }
  return images;
}

export async function GET() {
  try {
    const pageRes = await fetch(PAGE_API, { next: { revalidate: 3600 } });
    if (!pageRes.ok) throw new Error(`WP API responded with ${pageRes.status}`);

    const page = await pageRes.json();
    const htmlContent = page?.content?.rendered;

    if (!htmlContent) {
      return NextResponse.json([]);
    }

    const cssRes = await fetch(CSS_URL, { next: { revalidate: 3600 } });
    const cssText = cssRes.ok ? await cssRes.text() : "";
    const backgroundImages = extractBackgroundImages(cssText);

    const $ = cheerio.load(htmlContent);
    const banners: Banner[] = [];

    $('.elementor-widget-slides[data-widget_type="slides.default"]').each(
      (_, slider) => {
        $(slider)
          .find('[class*="elementor-repeater-item-"]')
          .each((_, item) => {
            const $item = $(item);
            const classAttr = $item.attr("class") || "";
            const repeaterMatch = classAttr.match(
              /elementor-repeater-item-[a-zA-Z0-9]+/,
            );

            if (repeaterMatch) {
              const repeaterId = repeaterMatch[0];
              let link: string | null = null;
              let ariaLabel: string | null = null;

              $item.children().each((_, child) => {
                const $child = $(child);
                if (child.type === "tag" && child.name === "div") {
                  const label = $child.attr("aria-label");
                  if (label) ariaLabel = label;
                }
                if (child.type === "tag" && child.name === "a") {
                  const href = $child.attr("href");
                  if (href) link = href;
                }
              });

              banners.push({
                repeater_id: repeaterId,
                image: backgroundImages[repeaterId] || null,
                link: link || $item.attr("href") || null,
                aria_label: ariaLabel || $item.attr("aria-label") || null,
              });
            }
          });
      },
    );

    // Deduplicate by repeater_id
    const uniqueBanners = Array.from(
      new Map(banners.map((b) => [b.repeater_id, b])).values(),
    );

    return NextResponse.json(uniqueBanners);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to fetch banners", details: msg },
      { status: 500 },
    );
  }
}
