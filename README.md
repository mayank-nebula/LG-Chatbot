safeFetchJSON: invalid JSON response preview: <!doctype html>
<html lang="en-US">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="profile" href="https://gmpg.org/xfn/11">
        <meta name='robots' content='index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' />
Error fetching RankMath head data: Error: Invalid JSON response
    at safeFetchJSON (lib\fetch.ts:42:11)
    at async getRankMathHead (lib\getRankMathHead.ts:231:17)
    at async Module.generateMetadata (app\community\page.tsx:17:5)
  40 |     const preview = text.slice(0, 300);
  41 |     console.error("safeFetchJSON: invalid JSON response preview:", preview);
> 42 |     throw new Error("Invalid JSON response");
     |           ^
  43 |   }
  44 | }
  45 |
