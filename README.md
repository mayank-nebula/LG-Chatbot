In **Next.js (App Router)** you can use `unstable_cache` to cache results based on a **key**.
If the **URL already exists in cache**, it returns the cached data.
If **not**, it calls your fetch function, stores the result, and returns it.

Below is a **simple pattern** for this.

---

# Example: Cache data by URL using `unstable_cache`

```ts
import { unstable_cache } from "next/cache";

/**
 * Dummy function to simulate fetching data
 */
async function fetchData(url: string) {
  console.log("Fetching fresh data for:", url);

  // simulate API delay
  await new Promise((r) => setTimeout(r, 500));

  return {
    url,
    data: "Dummy API response",
    time: Date.now(),
  };
}

/**
 * Function that returns cached data if exists,
 * otherwise fetches and stores it.
 */
export async function getCachedData(url: string) {
  const cachedFn = unstable_cache(
    async () => {
      return fetchData(url);
    },
    ["url-cache", url], // cache key
    {
      revalidate: 60, // seconds
    }
  );

  return cachedFn();
}
```

---

# Usage

```ts
const data = await getCachedData(
  "https://api.example.com/products?page=1"
);

console.log(data);
```

---

# What happens

1️⃣ First call

```
getCachedData(url)
```

* cache miss
* `fetchData()` runs
* result stored in Next.js cache

2️⃣ Second call with same URL

* cache hit
* `fetchData()` NOT called

3️⃣ Different URL

```
getCachedData("https://api.example.com/products?page=2")
```

* new cache entry created

---

# Example output

First call

```
Fetching fresh data for: https://api.example.com/products?page=1
```

Second call

```
(no log → returned from cache)
```

---

💡 **Important Tip**

Make sure the **URL is part of the cache key**:

```ts
["url-cache", url]
```

Otherwise different URLs could return the **same cached result**.

---

If you want, I can also show a **better production pattern** used in large Next.js apps (global cache helper + dedupe + tags).
