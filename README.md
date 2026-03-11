const seen = new Map<string, Video>();
    for (const video of results) {
      const slug = video.pageUrl.split("/").pop() ?? video.pageUrl;
      if (!seen.has(slug)) {
        seen.set(slug, video);
      }
    }

    return Array.from(seen.values());
