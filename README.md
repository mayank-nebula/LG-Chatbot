docker build --build-arg NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM="98YrqH6Dscus" --build-arg NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM="5ZTw6ANkhAus" --build-arg NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID="fa255aee-2eac-46bd-b722-e6753bb85595" --build-arg NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 --build-arg NODE_TLS_REJECT_UNAUTHORIZED=0 -t next-app-ltsc . --no-cache
[+] Building 0.0s (0/0)  docker:default
[+] Building 44.8s (11/14)                                                                                           docker:default
 => [internal] load build definition from Dockerfile                                                                           0.0s
 => => transferring dockerfile: 1.28kB                                                                                         0.0s
 => [internal] load metadata for docker.io/library/node:20-alpine                                                              2.6s
 => [internal] load .dockerignore                                                                                              0.0s
 => => transferring context: 614B                                                                                              0.0s
 => [internal] load build context                                                                                              0.1s
 => => transferring context: 15.12kB                                                                                           0.0s
 => [deps 1/4] FROM docker.io/library/node:20-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8   0.0s
 => CACHED [deps 2/4] WORKDIR /app                                                                                             0.0s
 => [deps 3/4] COPY package*.json ./                                                                                           0.0s
 => [deps 4/4] RUN npm ci                                                                                                     19.8s
 => [builder 3/5] COPY --from=deps /app/node_modules ./node_modules                                                            5.4s
 => [builder 4/5] COPY . .                                                                                                     0.2s
 => ERROR [builder 5/5] RUN npm run build                                                                                     15.1s
------
 > [builder 5/5] RUN npm run build:
0.615
0.615 > ltsc-site@0.1.0 build
0.615 > next build
0.615
1.877 ⚠ `images.domains` is deprecated in favor of `images.remotePatterns`. Please update next.config.ts to protect your application from malicious users.
1.897 Attention: Next.js now collects completely anonymous telemetry regarding usage.
1.897 This information is used to shape Next.js' roadmap and prioritize features.
1.897 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
1.897 https://nextjs.org/telemetry
1.897
1.910 ▲ Next.js 16.1.6 (Turbopack)
1.910
2.009   Creating an optimized production build ...
14.20 Turbopack build encountered 10 warnings:
14.20 [next]/internal/font/google/20f1c48c725d3555-s.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2
14.20
14.20
14.20 [next]/internal/font/google/345c85a432359eed-s.p.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2
14.20
14.20
14.20 [next]/internal/font/google/7d256325d16c464a-s.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AUi-qNiXg7eU0.woff2
14.20
14.20
14.20 [next]/internal/font/google/80dbc432bf467303-s.p.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AXC-qNiXg7Q.woff2
14.20
14.20
14.20 [next]/internal/font/google/8e451580e5e95631-s.p.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2
14.20
14.20
14.20 [next]/internal/font/google/9be384ea93fe3f49-s.p.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2
14.20
14.20
14.20 [next]/internal/font/google/b529365fa126a3f2-s.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2
14.20
14.20
14.20 [next]/internal/font/google/d74bdd14d6019bc6-s.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2
14.20
14.20
14.20 [next]/internal/font/google/da28569d36042d01-s.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwaPGQ3q5d0N7w.woff2
14.20
14.20
14.20 [next]/internal/font/google/f30fd2e485acf1bc-s.p.woff2
14.20 Error while requesting resource
14.20 There was an issue establishing a connection while requesting https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2
14.20
14.20
14.97
14.97 > Build error occurred
14.98 Error: Turbopack build failed with 10 errors:
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:8:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98    6 |   font-display: swap;
14.98    7 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AUi-qNiXg7eU0.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
14.98 >  8 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
14.98      |         ^
14.98    9 | }
14.98   10 | /* latin */
14.98   11 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:17:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   15 |   font-display: swap;
14.98   16 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AXC-qNiXg7Q.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
14.98 > 17 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
14.98      |         ^
14.98   18 | }
14.98   19 | /* latin-ext */
14.98   20 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:26:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   24 |   font-display: swap;
14.98   25 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
14.98 > 26 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
14.98      |         ^
14.98   27 | }
14.98   28 | /* latin */
14.98   29 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:35:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   33 |   font-display: swap;
14.98   34 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
14.98 > 35 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
14.98      |         ^
14.98   36 | }
14.98   37 | /* latin-ext */
14.98   38 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:44:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   42 |   font-display: swap;
14.98   43 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
14.98 > 44 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
14.98      |         ^
14.98   45 | }
14.98   46 | /* latin */
14.98   47 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:53:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   51 |   font-display: swap;
14.98   52 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
14.98 > 53 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
14.98      |         ^
14.98   54 | }
14.98   55 | /* latin-ext */
14.98   56 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:62:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   60 |   font-display: swap;
14.98   61 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
14.98 > 62 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
14.98      |         ^
14.98   63 | }
14.98   64 | /* latin */
14.98   65 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:71:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   69 |   font-display: swap;
14.98   70 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
14.98 > 71 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
14.98      |         ^
14.98   72 | }
14.98   73 | /* latin-ext */
14.98   74 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:80:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   78 |   font-display: swap;
14.98   79 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwaPGQ3q5d0N7w.woff2%22,%22preload%22:false,%22has_size_adjust%22:true}) format('woff2');
14.98 > 80 |   unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
14.98      |         ^
14.98   81 | }
14.98   82 | /* latin */
14.98   83 | @font-face {
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98 [next]/internal/font/google/lato_5542c2b5.module.css:89:9
14.98 Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
14.98   87 |   font-display: swap;
14.98   88 |   src: url(@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2%22,%22preload%22:true,%22has_size_adjust%22:true}) format('woff2');
14.98 > 89 |   unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
14.98      |         ^
14.98   90 | }
14.98   91 | @font-face {
14.98   92 |     font-family: 'Lato Fallback';
14.98
14.98 Import map: Resolved by import map
14.98
14.98
14.98 Import trace:
14.98   Server Component:
14.98     [next]/internal/font/google/lato_5542c2b5.module.css
14.98     [next]/internal/font/google/lato_5542c2b5.js
14.98     ./app/layout.tsx
14.98
14.98 https://nextjs.org/docs/messages/module-not-found
14.98
14.98
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:8:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:17:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:26:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:35:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:44:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:53:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:62:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:71:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:80:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
14.98     at <unknown> ([next]/internal/font/google/lato_5542c2b5.module.css:89:9)
14.98     at <unknown> (https://nextjs.org/docs/messages/module-not-found)
15.08 npm notice
15.08 npm notice New major version of npm available! 10.8.2 -> 11.8.0
15.08 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
15.08 npm notice To update run: npm install -g npm@11.8.0
15.08 npm notice
------
Dockerfile:25
--------------------
  23 |     ENV NODE_TLS_REJECT_UNAUTHORIZED=$NODE_TLS_REJECT_UNAUTHORIZED
  24 |
  25 | >>> RUN npm run build
  26 |
  27 |     # 3. Production Runner
--------------------
ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
