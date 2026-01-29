=> ERROR [builder 5/5] RUN npm run build                                                                                                                                 10.5s 
------
 > [builder 5/5] RUN npm run build:
0.482
0.482 > ltsc-site@0.1.0 build
0.482 > next build
0.482
1.318 ⚠ `images.domains` is deprecated in favor of `images.remotePatterns`. Please update next.config.ts to protect your application from malicious users.
1.334 ▲ Next.js 16.1.6 (Turbopack)
1.334
1.368   Creating an optimized production build ...
10.16 Turbopack build encountered 10 warnings:
10.16 [next]/internal/font/google/20f1c48c725d3555-s.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2
10.16
10.16
10.16 [next]/internal/font/google/345c85a432359eed-s.p.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2
10.16
10.16
10.16 [next]/internal/font/google/7d256325d16c464a-s.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AUi-qNiXg7eU0.woff2
10.16
10.16
10.16 [next]/internal/font/google/80dbc432bf467303-s.p.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AXC-qNiXg7Q.woff2
10.16
10.16
10.16 [next]/internal/font/google/8e451580e5e95631-s.p.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2
10.16
10.16
10.16 [next]/internal/font/google/9be384ea93fe3f49-s.p.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2
10.16
10.16
10.16 [next]/internal/font/google/b529365fa126a3f2-s.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2
10.16
10.16
10.16 [next]/internal/font/google/d74bdd14d6019bc6-s.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2
10.16
10.16
10.16 [next]/internal/font/google/da28569d36042d01-s.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwaPGQ3q5d0N7w.woff2
10.16
10.16
10.16 [next]/internal/font/google/f30fd2e485acf1bc-s.p.woff2
10.16 Error while requesting resource
10.16 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2
10.16
10.16
10.28
10.28 > Build error occurred
10.29 Error: Turbopack build failed with 10 errors:
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:8:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29    6 |   font-display: swap;
10.29    7 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AUi-qNiXg7eU0.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
10.29 >  8 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
10.29      |         ^
10.29    9 | }
10.29   10 | /* latin */
10.29   11 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:17:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   15 |   font-display: swap;
10.29   16 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AXC-qNiXg7Q.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
10.29 > 17 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
10.29      |         ^
10.29   18 | }
10.29   19 | /* latin-ext */
10.29   20 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:26:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   24 |   font-display: swap;
10.29   25 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
10.29 > 26 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
10.29      |         ^
10.29   27 | }
10.29   28 | /* latin */
10.29   29 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:35:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   33 |   font-display: swap;
10.29   34 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
10.29 > 35 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
10.29      |         ^
10.29   36 | }
10.29   37 | /* latin-ext */
10.29   38 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:44:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   42 |   font-display: swap;
10.29   43 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
10.29 > 44 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
10.29      |         ^
10.29   45 | }
10.29   46 | /* latin */
10.29   47 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:53:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   51 |   font-display: swap;
10.29   52 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
10.29 > 53 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
10.29      |         ^
10.29   54 | }
10.29   55 | /* latin-ext */
10.29   56 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:62:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   60 |   font-display: swap;
10.29   61 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
10.29 > 62 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
10.29      |         ^
10.29   63 | }
10.29   64 | /* latin */
10.29   65 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:71:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   69 |   font-display: swap;
10.29   70 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
10.29 > 71 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
10.29      |         ^
10.29   72 | }
10.29   73 | /* latin-ext */
10.29   74 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:80:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   78 |   font-display: swap;
10.29   79 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwaPGQ3q5d0N7w.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
10.29 > 80 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
10.29      |         ^
10.29   81 | }
10.29   82 | /* latin */
10.29   83 | @font-face {
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29 [next]/internal/font/google/lato_5542c2b5.module.css:89:9
10.29 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
10.29   87 |   font-display: swap;
10.29   88 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
10.29 > 89 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
10.29      |         ^
10.29   90 | }
10.29   91 | @font-face {
10.29   92 |     font-family: 'Lato Fallback';
10.29
10.29 Import map: Resolved by import map
10.29
10.29
10.29 Import trace:
10.29   Server Component:
10.29     [next]/internal/font/google/lato_5542c2b5.module.css
10.29     [next]/internal/font/google/lato_5542c2b5.js
10.29     ./app/layout.tsx
10.29
10.29 https://nextjs.org/docs/messages/module-not-found
10.29
10.29
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:8:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:17:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:26:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:35:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:44:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:53:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:62:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:71:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:80:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.29     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:89:9)
10.29     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
10.36 npm notice
10.36 npm notice New major version of npm available! 10.8.2 -> 11.8.0
10.36 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
10.36 npm notice To update run: npm install -g npm@11.8.0
10.36 npm notice
------
Dockerfile:36
--------------------
  34 |
  35 |     # Build the application
  36 | >>> RUN npm run build
  37 |
  38 |     # Stage 3: Production image
--------------------
ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

View build details: docker-desktop://dashboard/build/default/default/y3n73egqriqutendxqf0065v5
