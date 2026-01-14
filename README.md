import { NextResponse } from 'next/server';

// Define the shape of our formatted response
interface FormattedProduct {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredMedia: {
    url: string;
    alt: string;
  } | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '10';
  
  const WP_URL = process.env.WORDPRESS_API_URL;

  try {
    /**
     * STEP 1: Fetch Products
     * We include 'featured_media' in _fields. 
     * This gives us the ID needed for the batch media call.
     */
    const productFields = 'id,title,slug,content,excerpt,featured_media';
    const productsRes = await fetch(
      `${WP_URL}/wp/v2/product?page=${page}&per_page=${perPage}&_fields=${productFields}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!productsRes.ok) {
      return NextResponse.json({ error: 'WP Fetch Failed' }, { status: productsRes.status });
    }

    const products = await productsRes.json();

    /**
     * STEP 2: Batch Media Request
     * Collect all unique media IDs. We filter out '0' (no image).
     */
    const mediaIds = [...new Set(products.map((p: any) => p.featured_media).filter((id: number) => id > 0))];
    
    let mediaMap: Record<number, { url: string; alt: string }> = {};

    if (mediaIds.length > 0) {
      // Fetch all required images in ONE call using 'include'
      const mediaFields = 'id,source_url,alt_text';
      const mediaRes = await fetch(
        `${WP_URL}/wp/v2/media?include=${mediaIds.join(',')}&_fields=${mediaFields}`
      );

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        mediaMap = mediaData.reduce((acc: any, media: any) => {
          acc[media.id] = {
            url: media.source_url,
            alt: media.alt_text,
          };
          return acc;
        }, {});
      }
    }

    /**
     * STEP 3: Combine Data
     */
    const data: FormattedProduct[] = products.map((product: any) => ({
      id: product.id,
      title: product.title.rendered,
      slug: product.slug,
      content: product.content.rendered,
      excerpt: product.excerpt.rendered,
      featuredMedia: mediaMap[product.featured_media] || null,
    }));

    // Pass along pagination headers so the frontend knows if there is a 'Next' page
    return NextResponse.json({
      data,
      meta: {
        total: parseInt(productsRes.headers.get('X-WP-Total') || '0'),
        totalPages: parseInt(productsRes.headers.get('X-WP-TotalPages') || '0'),
        currentPage: parseInt(page),
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
