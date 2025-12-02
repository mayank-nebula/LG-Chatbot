const processedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const mediaUrl = post?._links?.["wp:featuredmedia"]?.[0]?.href;

        let featured_image = null;

        if (mediaUrl) {
          try {
            const mediaRes = await fetch(mediaUrl, {
              headers: { Accept: "application/json" },
              next: { revalidate: 120 },
            });

            if (mediaRes.ok) {
              const media = await mediaRes.json();
              featured_image =
                media?.source_url ||
                media?.media_details?.sizes?.medium?.source_url ||
                null;
            }
          } catch {
            featured_image = null;
          }
        }

        // Return post with everything except _links
        const { _links, ...rest } = post;

        return {
          ...rest,
          featured_image,
        };
      })
    );
