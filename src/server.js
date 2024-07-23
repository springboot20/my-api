import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { swaggerSpec, swaggerUi } from "./documentation/swagger.js";

dotenv.config({ path: "./.env" });

import {router} from "./routes/auth/user.routes.js"
import {
  notFoundError,
  handleError,
} from "./middleware/error/error.middleware.js";
import mongoDbConnection from "./connection/mongodb.connection.js";

let port = process.env.PORT ?? 8080;

mongoose.connection.on("connect", () => {
  console.log("Mongodb connected ....");
});

process.on("SIGINT", () => {
  mongoose.connection.once("disconnect", () => {
    console.log("Mongodb disconnected..... ");
    process.exit(0);
  });
});

const app = express();
const httpServer = http.createServer(app);

app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      docExpansion: "none", // keep all the sections collapsed by default
    },
    customSiteTitle: "Banking Rest Api Docs",
  })
);

app.use("docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);

  console.log(`Docs available at http://localhost:${port}`);
});

app.use(express.json({ limit: "16kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "16kb" }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use("/api/v1/users", router);

/**
 * @openapi
 *    /api/v1/healthcheck:
 *        tag
 * 
 */
app.get("/api/v1/healthcheck", (req, res) => res.sendStatus(200));


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
    console.log(`⚙️⚡ Server running at http://localhost:${port}/api/v1/docs 🌟🌟`);
  });
};

mongoDbConnection()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.log(error);
  });

// app.use(notFoundError);
app.use(handleError);