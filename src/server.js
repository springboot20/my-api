import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { Server } from "socket.io";
import * as path from "path";
import { create } from "express-handlebars";
import * as url from "url";
import fs from "fs";

import {
  healthcheck,
  authRoutes,
  accountRoutes,
  statisticRoutes,
  transactionRoutes,
  profileRoutes,
  cardRoutes,
  messageRoutes,
} from "./routes/index.routes.js";
import { notFoundError, handleError } from "./middleware/error/error.middleware.js";
import mongoDbConnection from "./connection/mongodb.connection.js";
import { specs } from "./documentation/swagger.js";
import { intializeSocketIo } from "./socket/socket.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
let port = process.env.PORT ?? 8080;

// const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()) || [];

const finalAllowedOrigins = [
  "https://banking-app-admin.vercel.app",
  "https://affiliate-dashboard-4sgw.vercel.app",
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:3000",
];

console.log(process.env.BASE_URL_PROD, "Prod");
console.log(process.env.BASE_URL_PROD_ADMIN, "Prod-admin");
console.log(process.env.CORS_ORIGINS);
console.log(finalAllowedOrigins);

export const corsOriginChecker = function (origin, callback) {
  if (finalAllowedOrigins.indexOf(origin) !== -1 || !origin) {
    callback(null, true);
  } else {
    console.log("Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  }
};

// Configure CORS middleware first before any routes

app.use(
  cors({
    origin: finalAllowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-access-token",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);
app.options(
  "*",
  cors({
    origin: finalAllowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-access-token",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
); // Preflight handler

// socket io connection setups
const io = new Server(httpServer, {
  cors: {
    origin: finalAllowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

intializeSocketIo(io);
app.set("io", io);

// Log MongoDB connection status
mongoose.connection.on("connected", () => {
  console.log("Mongodb connected ....");
});

process.on("SIGINT", () => {
  mongoose.connection.once("disconnect", () => {
    console.log("Mongodb disconnected..... ");
    process.exit(0);
  });
});

// Serve Swagger UI
app.use(
  "/api/v1/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
      docExpansion: "none", // keep all the sections collapsed by default
    },
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "16kb" }));
app.use(bodyParser.json());

app.use("/public", express.static(__dirname + "/public"));

const hbs2 = create({
  defaultLayout: path.join(__dirname, "views/layouts/index.hbs"),
  extname: "hbs",
  partialsDir: [path.join(__dirname, "views/partials")],
});

app.engine("hbs", hbs2.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Register partials dynamically
const partialsDir = path.join(__dirname, "views/partials");

// Read and register each partial
fs.readdirSync(partialsDir).forEach((file) => {
  const filePath = path.join(partialsDir, file);
  const partialName = path.basename(file, path.extname(file));
  const partialContent = fs.readFileSync(filePath, "utf8");
  hbs2?.handlebars?.registerPartial(partialName, partialContent);
});

app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  console.log("Allowed Origins:", finalAllowedOrigins);
  console.log("Origin allowed:", finalAllowedOrigins.includes(req.headers.origin));

  res.header("Access-Control-Allow-Origin", "https://banking-app-admin.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,x-access-token,Origin,X-Requested-With,Accept"
  );
  next();
});

app.use("/api/v1/banking/healthcheck", healthcheck.default);
app.use("/api/v1/banking/auth", authRoutes.default);
app.use("/api/v1/banking/accounts", accountRoutes.default);
app.use("/api/v1/banking/card", cardRoutes.default);
app.use("/api/v1/banking/transactions", transactionRoutes.default);
app.use("/api/v1/banking/statistics", statisticRoutes.default);
app.use("/api/v1/banking/profile", profileRoutes.default);
app.use("/api/v1/banking/messagings", messageRoutes.default);

app.get("/", (_, res) => {
  res.redirect("api/v1/api-docs");
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip} - Origin: ${req.headers.origin || "none"}`);
  next();
});

httpServer.on("error", (error) => {
  if (error instanceof Error) {
    if (error.name === "EADDRINUSE") {
      console.log(`Port ${port} already in use`);
    } else {
      console.log(`Server error : ${error}`);
    }
  }
});

const startServer = () => {
  httpServer.listen(port, () => {
    console.info(`📑 Visit the documentation at: http://localhost:${port}/api/v1/api-docs`);
    console.log(`⚙️⚡ Server running at http://localhost:${port} 🌟🌟`);
  });
};

mongoDbConnection()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.log(error);
  });

app.use(notFoundError);
app.use(handleError);
