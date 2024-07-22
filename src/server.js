import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
// import cookieParser from 'cookie-parser';
import http from 'http';
import dotenv from "dotenv";
import mongoose from "mongoose";


import * as routes from './routes/index.js';
import { notFoundError, handleError } from './middleware/error/error.middleware.js';
import mongoDbConnection from "./connection/mongodb.connection.js";

dotenv.config({ path: './src/.env' });

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

app.use(express.json({ limit: '16kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.json());

app.use(express.static('public'));
// app.use(cookieParser());


app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use('/api/v1/users', routes.authRoute.router);
// app.use('/api/v1/transactions');

app.get('/', (req, res) => res.send('Hello world from home page'));

app.use(notFoundError);
app.use(handleError);


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
