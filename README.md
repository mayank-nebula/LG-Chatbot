const finalItems = hasMore ? slice.slice(0, limit) : slice;

    const rows = finalItems.map((post) => ({
      title: post.title,
      slug: post.slug,
      date: post.date,
      featured_media: post.featured_media,
      tag: post.tag // returning the array as it exists in JSON
    }));

    // 5. Response
    return NextResponse.json({
      rows,
      hasMore,
      nextPage,
      currentPage: page
    });
