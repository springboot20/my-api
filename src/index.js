import 'module-alias/register'
import dotenv from 'dotenv'
import {mongoDbConnection} from '@connection/mongodb.connection'
import { httpServer } from './server';

dotenv.config({  path:'.env'})

let port = process.env.PORT ?? 8080

const startServer = () => {
  httpServer.listen(port, () => {
    console.info(
      `📑 Visit the documentation at: http://localhost:${
        port
      }`
    );
    console.log("⚙️  Server is running on port: " + process.env.PORT);
  });
};


mongoDbConnection
.then(() => {
      startServer();
    })
    .catch((err) => {
      console.log("Mongo db connect error: ", err);
    });