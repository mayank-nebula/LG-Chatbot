const post = postsData.find((p) => p.slug === slug);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 3. Filter the data (Pick only the fields you want to send)
    // Adjust this list based on what your frontend needs
    const filteredPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      date: post.date,
      content: post.content, // Usually needed for detail page
      featured_image: post.featured_image,
      featured_media: post.featured_media,
      tag: post.tag
    };

    return NextResponse.json(filteredPost);
