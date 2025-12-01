The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
 ✓ Ready in 1714ms
(node:25608) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)
 ⨯ Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at middleware (middleware.ts:12:24)
  10 |   if (existing) return NextResponse.next();
  11 |
> 12 |   const newId = crypto.randomUUID();
     |                        ^
  13 |
  14 |   const res = NextResponse.next();
  15 |   res.cookies.set({
 ⚠ ./middleware.ts:2:1
Ecmascript file had an error
  1 | import { NextRequest, NextResponse } from "next/server";
> 2 | import crypto from "crypto";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  3 |
  4 | const COOKIE_NAME = "anon_session";
  5 | const THIRTY_DAYS = 60 * 60 * 24 * 30;

A Node.js module is loaded ('crypto' at line 2) which is not supported in the Edge Runtime.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
