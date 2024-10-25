Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
9|express_application  |     at ServerResponse.setHeader (node:_http_outgoing:655:11)
9|express_application  |     at ServerResponse.header (/home/mayank.sharma9/GV/express/node_modules/express/lib/response.js:795:10)
9|express_application  |     at ServerResponse.send (/home/mayank.sharma9/GV/express/node_modules/express/lib/response.js:175:12)
9|express_application  |     at ServerResponse.json (/home/mayank.sharma9/GV/express/node_modules/express/lib/response.js:279:15)
9|express_application  |     at /home/mayank.sharma9/GV/express/app.js:60:26
9|express_application  |     at Layer.handle_error (/home/mayank.sharma9/GV/express/node_modules/express/lib/router/layer.js:71:5)
9|express_application  |     at trim_prefix (/home/mayank.sharma9/GV/express/node_modules/express/lib/router/index.js:326:13)
9|express_application  |     at /home/mayank.sharma9/GV/express/node_modules/express/lib/router/index.js:286:9
9|express_application  |     at Function.process_params (/home/mayank.sharma9/GV/express/node_modules/express/lib/router/index.js:346:12)
9|express_application  |     at next (/home/mayank.sharma9/GV/express/node_modules/express/lib/router/index.js:280:10)
