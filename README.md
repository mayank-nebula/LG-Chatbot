function cleanLdJson(raw: string): string {
  // Replace invalid \' with just ' (most common culprit)
  let cleaned = raw.replace(/\\'/g, "'");

  // Replace invalid \& with &
  cleaned = cleaned.replace(/\\&/g, "&");

  // Remove any other invalid single-char escapes not allowed in JSON
  // Valid JSON escapes: \" \\ \/ \b \f \n \r \t \uXXXX
  // This regex matches a backslash followed by any character NOT in that valid list,
  // and replaces it with just the character itself.
  cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, "$1");

  return cleaned;
}

/**
 * Safely extract and parse all application/ld+json script tags from HTML.
 * Handles invalid escape sequences gracefully.
 */
function extractLdJson(html: string): any[] {
  const results: any[] = [];
  
  // Find all <script type="application/ld+json">...</script>
  // This regex handles any attributes that might appear before or after the type attribute.
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw || !raw.trim()) continue;

    // First attempt: parse as-is
    try {
      results.push(JSON.parse(raw));
      continue;
    } catch (e) {
      // Failed to parse, move to second attempt
    }

    // Second attempt: clean invalid escapes then retry
    try {
      const cleaned = cleanLdJson(raw);
      results.push(JSON.parse(cleaned));
    } catch (e) {
      console.warn("Warning: Failed to parse ld+json block after cleaning:", e);
    }
  }

  return results;
}
