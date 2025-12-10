Below is a **complete project structure + full production-ready code** for a **Next.js app** that includes BOTH of your requirements:

---

# ✅ **Final Requirements Covered**

### ✔️ YouTube API caching (with page + t + distributed locking)

### ✔️ LinkedIn API token refresh + caching + post listing caching

### ✔️ Centralized Redis connection

### ✔️ Shared `getOrSetCache` helper with lock logic

### ✔️ Clean folder structure for a real Next.js project

---

# 📁 **Recommended Folder Structure**

```
/your-project
│
├── app/
│   ├── api/
│   │   ├── youtube/
│   │   │   └── route.js        ← YouTube posts paging API
│   │   ├── linkedin/
│   │   │   └── posts/route.js  ← LinkedIn org posts API
│   │   └── health/route.js     ← (optional) for uptime pings
│   │
│   └── page.js                 ← Example frontend
│
├── lib/
│   ├── redis.js                ← Redis connection (hot reload safe)
│   ├── cache.js                ← getOrSetCache() + locking logic
│   ├── linkedinAuth.js         ← LinkedIn access token refresh logic
│   ├── youtube.js              ← YouTube fetch wrapper
│
├── .env.local                  ← API keys + secrets
├── package.json
└── README.md
```

---

# 🔧 **1. lib/redis.js**

### Safe Redis connection for Next.js

```js
// lib/redis.js
import { createClient } from "redis";

let client = global.__redisClient;

if (!client) {
  client = createClient({
    url: process.env.REDIS_URL, // Upstash or Memorystore Proxy
  });

  client.on("error", (err) => console.error("Redis Error:", err));

  global.__redisClient = client;
}

export async function getRedis() {
  if (!client.isOpen) await client.connect();
  return client;
}
```

---

# 🔧 **2. lib/cache.js**

### Distributed locking + cache stampede prevention

```js
// lib/cache.js
import crypto from "crypto";
import { getRedis } from "./redis";

const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(redis, key, ttlMs) {
  const token = crypto.randomBytes(16).toString("hex");
  const ok = await redis.set(key, token, { NX: true, PX: ttlMs });
  return ok ? token : null;
}

async function releaseLock(redis, key, token) {
  await redis.eval(RELEASE_LOCK_SCRIPT, {
    keys: [key],
    arguments: [token],
  });
}

export async function getOrSetCache(
  key,
  ttlSec,
  fetcher,
  {
    lockTtlMs = 10_000,
    waitTimeoutMs = 8_000,
    retryDelayBaseMs = 100,
  } = {}
) {
  const redis = await getRedis();

  // 1️⃣ Check cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // 2️⃣ Try lock
  const lockKey = `${key}:lock`;
  const lockToken = await acquireLock(redis, lockKey, lockTtlMs);

  if (lockToken) {
    // OWNER OF LOCK
    try {
      const doubleCheck = await redis.get(key);
      if (doubleCheck) return JSON.parse(doubleCheck);

      const fresh = await fetcher();

      await redis.set(key, JSON.stringify(fresh), { EX: ttlSec });

      return fresh;
    } finally {
      await releaseLock(redis, lockKey, lockToken);
    }
  }

  // 3️⃣ WAITERS
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < waitTimeoutMs) {
    attempt++;
    const raw = await redis.get(key);
    if (raw) return JSON.parse(raw);

    await sleep(Math.min(1000, retryDelayBaseMs * attempt));
  }

  // 4️⃣ Fallback fetch (rare)
  const fallback = await fetcher();
  await redis.set(key, JSON.stringify(fallback), { EX: ttlSec });
  return fallback;
}
```

---

# 🔧 **3. lib/linkedinAuth.js**

### LinkedIn Access Token Refresh + Caching + Lock

```js
// lib/linkedinAuth.js
import axios from "axios";
import crypto from "crypto";
import { getRedis } from "./redis";

const ACCESS_KEY = "linkedin:access_token";
const REFRESH_KEY = "linkedin:refresh_token";
const LOCK_KEY = "linkedin:token_lock";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

async function acquireLock(redis, key, ttlMs) {
  const token = crypto.randomBytes(16).toString("hex");
  const ok = await redis.set(key, token, { NX: true, PX: ttlMs });
  return ok ? token : null;
}

async function releaseLock(redis, key, token) {
  await redis.eval(RELEASE_LOCK_SCRIPT, { keys: [key], arguments: [token] });
}

export async function getLinkedInAccessToken() {
  const redis = await getRedis();

  // 1️⃣ Try cache
  const cached = await redis.get(ACCESS_KEY);
  if (cached) return cached;

  // 2️⃣ Try lock
  const lockToken = await acquireLock(redis, LOCK_KEY, 10_000);

  if (lockToken) {
    try {
      const again = await redis.get(ACCESS_KEY);
      if (again) return again;

      const refreshToken =
        (await redis.get(REFRESH_KEY)) ||
        process.env.LINKEDIN_REFRESH_TOKEN;

      const res = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        null,
        {
          params: {
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          },
        }
      );

      const { access_token, refresh_token, expires_in } = res.data;

      await redis.set(ACCESS_KEY, access_token, { EX: expires_in });
      if (refresh_token) await redis.set(REFRESH_KEY, refresh_token);

      return access_token;
    } finally {
      await releaseLock(redis, LOCK_KEY, lockToken);
    }
  }

  // 3️⃣ Waiters
  const start = Date.now();
  while (Date.now() - start < 8000) {
    const token = await redis.get(ACCESS_KEY);
    if (token) return token;
    await sleep(200);
  }

  throw new Error("Token generation timeout");
}
```

---

# 🔧 **4. lib/youtube.js (wrapper)**

```js
// lib/youtube.js
import axios from "axios";

export async function fetchYouTubeData({ page, t }) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  const res = await axios.get(
    "https://www.googleapis.com/youtube/v3/search",
    {
      params: {
        part: "snippet",
        q: t,
        maxResults: 10,
        pageToken: page === "1" ? undefined : page,
        key: API_KEY,
      },
    }
  );

  return {
    page,
    t,
    results: res.data.items,
    nextPageToken: res.data.nextPageToken,
  };
}
```

---

# 🟦 **5. app/api/youtube/route.js**

```js
import { getOrSetCache } from "@/lib/cache";
import { fetchYouTubeData } from "@/lib/youtube";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "1";
  const t = searchParams.get("t") ?? "default";

  const key = `yt:${page}:${t}`;

  const data = await getOrSetCache(
    key,
    60, // TTL
    () => fetchYouTubeData({ page, t })
  );

  return Response.json(data);
}
```

---

# 🟦 **6. app/api/linkedin/posts/route.js**

```js
import axios from "axios";
import { getOrSetCache } from "@/lib/cache";
import { getLinkedInAccessToken } from "@/lib/linkedinAuth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const orgId = process.env.LINKEDIN_ORG_ID;

  const pageSize = 10;
  const start = (Math.max(1, page) - 1) * pageSize;

  const cacheKey = `linkedin:posts:${orgId}:${page}`;

  const data = await getOrSetCache(
    cacheKey,
    120, // TTL
    async () => {
      const token = await getLinkedInAccessToken();

      const res = await axios.get("https://api.linkedin.com/rest/posts", {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202306",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        params: {
          q: "author",
          author: `urn:li:organization:${orgId}`,
          count: pageSize,
          start,
          sortBy: "PUBLISHED",
        },
      });

      return {
        page,
        posts: res.data.elements,
        nextPage: page + 1,
      };
    }
  );

  return Response.json(data);
}
```

---

# 🧪 **7. app/page.js (demo UI)**

```jsx
export default function Page() {
  return (
    <div>
      <h1>API Demo Running</h1>
      <p>Using Redis + Locking for LinkedIn + YouTube APIs</p>
    </div>
  );
}
```

---

# 🔐 **8. .env.local Example**

```
REDIS_URL=redis://default:password@host:6379

YOUTUBE_API_KEY=XXXX
LINKEDIN_CLIENT_ID=XXXX
LINKEDIN_CLIENT_SECRET=XXXX
LINKEDIN_REFRESH_TOKEN=XXXX
LINKEDIN_ORG_ID=XXXX
```

---

# 🎉 **DONE — This is the complete integrated production-grade project**

You now have:

### 🔹 YouTube caching (page + t)

### 🔹 LinkedIn token refresh + caching

### 🔹 LinkedIn posts caching

### 🔹 Distributed locking

### 🔹 Safe Redis client

### 🔹 Full routing + folder structure

---

# Want me to generate:

### 🚀 A TypeScript version?

### 🚀 Dockerfile + Cloud Run deployment setup?

### 🚀 Upstash version for Vercel deployment?

### 🚀 Error monitoring + logging + metrics version?

Just tell me!



















import { getOrSetCache } from "@/lib/cache";
import { alloydb } from "@/lib/db"; // your client, placeholder

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 20;

  const offset = (page - 1) * pageSize;
  const cacheKey = `db:articles:${page}`;

  const result = await getOrSetCache(
    cacheKey,
    60, // TTL = 60 seconds
    async () => {
      const rows = await alloydb.query(
        `SELECT id, title FROM articles ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      );
      return rows;
    }
  );

  return Response.json(result);
}

