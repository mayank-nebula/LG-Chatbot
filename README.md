const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const path = require("path");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const app = express();

const chatRoutes = require("./routes/chatting");
const documentRoutes = require("./routes/document");
const privateKey = fs.readFileSync(path.join(__dirname, "certs", "server.key"));
const certificate = fs.readFileSync(
  path.join(__dirname, "certs", "server.cert")
);

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: [
      "https://evalueserveglobal.sharepoint.com",
      "https://gatesventures.sharepoint.com/sites/scientia/_layouts/15/workbench.aspx",
      "https://gatesventures.sharepoint.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/api", chatRoutes);
app.use("/api", documentRoutes);
app.use("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Express Server",
  });
});

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  res.status(statusCode).json({
    message: message,
  });
});

mongoose
  .connect(process.env.MONGO_API_KEY)
  .then((result) => {
    const server = https
      .createServer({ key: privateKey, cert: certificate }, app)
      .listen(8080, "0.0.0.0", () => {
        console.log("Server is running on port 8080");
      });
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));
