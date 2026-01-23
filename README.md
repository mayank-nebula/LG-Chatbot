export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15_000
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout} ms: ${url}`));
    }, timeout);

    fetch(url, options)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function safeFetchJSON(url: string, options: RequestInit = {}) {
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0", ...(options.headers ?? {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fetch failed (${res.status}) ${url} - ${body}`);
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    // Provide a short preview to help diagnosis without leaking everything.
    const preview = text.slice(0, 300);
    console.error("safeFetchJSON: invalid JSON response preview:", preview);
    throw new Error("Invalid JSON response");
  }
}
