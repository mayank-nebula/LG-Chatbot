app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = allowedOrigins;
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Access Denied: Authentication Failed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
