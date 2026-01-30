Sending email with payload: {
  "message": {
    "from_email": "events.letstalksupplychain.com",
    "subject": "Welcome to LTSC",
    "html": "\n    <!DOCTYPE html>\n    <html>\n      <body style=\"font-family: sans-serif; line-height: 1.5; color: #333;\">\n        <div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\">\n          \n          <h2 style=\"color: #0070f3;\">Welcome, Mayank!</h2>\n          \n          <p>\n            Thanks for joining <strong>LTSC</strong>. \n            We are excited to have you on board.\n          </p>\n          \n          <p>Please click the button below to get started:</p>\n\n          <p style=\"margin-top: 30px; font-size: 12px; color: #888;\">\n            If you didn't ask for this email, you can ignore it.\n          </p>\n          \n        </div>\n      </body>\n    </html>\n  ",
    "to": [
      {
        "email": "mayank.sharma9@evalueserve.com",
        "type": "to"
      }
    ]
  },
  "send_at": "2026-01-30 05:33:39"
}
Mailchimp response: {
  "message": "Request failed with status code 400",
  "name": "AxiosError",
  "stack": "AxiosError: Request failed with status code 400\n    at settle (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\node_modules_axios_dist_node_axios_cjs_ef84af05._.js:1735:16)\n    at Unzip.handleStreamEnd (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\node_modules_axios_dist_node_axios_cjs_ef84af05._.js:2812:21)\n    at Unzip.emit (node:events:519:28)\n    at endReadableNT (node:internal/streams/readable:1698:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)\n    at Axios.request (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\node_modules_axios_dist_node_axios_cjs_ef84af05._.js:3776:49)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async POST (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\[root-of-the-server]__a4d9071d._.js:279:26)\n    at async AppRouteRouteModule.do (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:5:37866)\n    at async AppRouteRouteModule.handle (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:5:45156)\n    at async responseGenerator (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\node_modules_next_08485066._.js:15344:38)\n    at async AppRouteRouteModule.handleResponse (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:1:191938)\n    at async handleResponse (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\node_modules_next_08485066._.js:15407:32)\n    at async Module.handler (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\.next\\dev\\server\\chunks\\node_modules_next_08485066._.js:15460:13)\n    at async DevServer.renderToResponseWithComponentsImpl (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\base-server.js:1442:9)\n    at async DevServer.renderPageComponent (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\base-server.js:1494:24)\n    at async DevServer.renderToResponseImpl (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\base-server.js:1544:32)\n    at async DevServer.pipeImpl (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\base-server.js:1038:25)\n    at async NextNodeServer.handleCatchallRenderRequest (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\next-server.js:395:17)\n    at async DevServer.handleRequestImpl (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\base-server.js:929:17)\n    at async C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:387:20\n    at async Span.traceAsyncFn (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\trace\\trace.js:157:20)\n    at async DevServer.handleRequest (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:383:24)\n    at async invokeRender (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\lib\\router-server.js:248:21)\n    at async handleRequest (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\lib\\router-server.js:447:24)\n    at async requestHandlerImpl (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\lib\\router-server.js:496:13)\n    at async Server.requestListener (C:\\Users\\Mayank.Sharma9\\Desktop\\LTCS\\git-repo\\content-workflow-project\\node_modules\\next\\dist\\server\\lib\\start-server.js:226:13)",
  "config": {
    "transitional": {
      "silentJSONParsing": true,
      "forcedJSONParsing": true,
      "clarifyTimeoutError": false
    },
    "adapter": [
      "xhr",
      "http",
      "fetch"
    ],
    "transformRequest": [
      null
    ],
    "transformResponse": [
      null
    ],
    "timeout": 300000,
    "xsrfCookieName": "XSRF-TOKEN",
    "xsrfHeaderName": "X-XSRF-TOKEN",
    "maxContentLength": -1,
    "maxBodyLength": -1,
    "env": {},
    "headers": {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "User-Agent": "Transactional-JS/1.1.2",
      "Content-Length": "929",
      "Accept-Encoding": "gzip, compress, deflate, br"
    },
    "method": "post",
    "url": "https://mandrillapp.com/api/1.0/messages/send",
    "data": "{\"message\":{\"from_email\":\"events.letstalksupplychain.com\",\"subject\":\"Welcome to LTSC\",\"html\":\"\\n    <!DOCTYPE html>\\n    <html>\\n      <body style=\\\"font-family: sans-serif; line-height: 1.5; color: #333;\\\">\\n        <div style=\\\"max-width: 600px; margin: 0 auto; padding: 20px;\\\">\\n          \\n          <h2 style=\\\"color: #0070f3;\\\">Welcome, Mayank!</h2>\\n          \\n          <p>\\n            Thanks for joining <strong>LTSC</strong>. \\n            We are excited to have you on board.\\n          </p>\\n          \\n          <p>Please click the button below to get started:</p>\\n\\n          <p style=\\\"margin-top: 30px; font-size: 12px; color: #888;\\\">\\n            If you didn't ask for this email, you can ignore it.\\n         
 </p>\\n          \\n        </div>\\n      </body>\\n    </html>\\n  \",\"to\":[{\"email\":\"mayank.sharma9@evalueserve.com\",\"type\":\"to\"}]},\"send_at\":\"2026-01-30 05:33:39\",\"key\":\"md--r40IPZRBAdIVu6d5jPohw\"}",
    "allowAbsoluteUrls": true
  },
  "code": "ERR_BAD_REQUEST",
  "status": 400
}
Unexpected response format: Error [AxiosError]: Request failed with status code 400
    at async POST (app\api\schedule-transactional\route.ts:74:22)
  72 |     );
  73 |
> 74 |     const response = await client.messages.send(payload);
     |                      ^
  75 |
  76 |     console.log("Mailchimp response:", JSON.stringify(response, null, 2));
  77 | {
  isAxiosError: true,
  code: 'ERR_BAD_REQUEST',
  config: [Object],
  request: [ClientRequest],
  response: [Object],
  status: 400
}
