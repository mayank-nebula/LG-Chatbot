app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://evalueserveglobal.sharepoint.com",
        "https://gatesventures.sharepoint.com/sites/scientia/_layouts/15/workbench.aspx",
        "https://gatesventures.sharepoint.com",
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Access Denied: Authentication Failed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Security-Header"],
    credentials: true,
  })
);
