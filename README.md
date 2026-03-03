Subject: REST API Returning Stale Data — Cloudways Varnish Cache Issue

Hi,

I wanted to document the issue we investigated today regarding our WordPress REST API returning outdated data across browsers.

---

ISSUE SUMMARY
Our custom REST API endpoint (/wp-json/site/v1/options/*) was returning stale data — specifically, updates made at 5:00 PM IST on 3rd March 2026 were not reflecting, and the API was serving data from 9:45 AM IST (7+ hours old).

---

ROOT CAUSE
After inspecting the HTTP response headers, the issue was identified as Cloudways Server-Side Varnish Cache.

Here are the exact response headers that confirm this:

  cache-provider: CLOUDWAYS-CACHE-DE
  s-maxage: 2592000 (30 days cache)
  last-modified: Tue, 03 Mar 2026 04:15:13 GMT (9:45 AM IST)
  cf-cache-status: DYNAMIC

Key findings:
- cache-provider clearly identifies Cloudways as the cache provider
- s-maxage of 2592000 seconds means Cloudways was caching the API response for 30 days
- last-modified confirms the cached response was from 9:45 AM IST, not reflecting the 5 PM update
- cf-cache-status: DYNAMIC confirms Cloudflare was NOT involved — it was passing requests through without caching

Cloudflare is completely ruled out as a cause.

---

FIX
The following steps need to be taken in the Cloudways Dashboard:

1. Go to Application Settings → Varnish
2. Add /wp-json/site/v1/options/ to the cache exclusion list
3. Save settings
4. Purge Varnish Cache from the dashboard immediately to clear the existing stale responses

This will ensure our REST API endpoint always returns fresh data and is never cached by Cloudways going forward.

---

Please let me know if you need any further details.

Regards
