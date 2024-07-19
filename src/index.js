import dotenv from 'dotenv';
import { mongoDbConnection } from './connection/mongodb.connection.js';
import { httpServer } from './server.js';
import mongoose from 'mongoose';

dotenv.config({ path: '.env' });

let port = process.env.PORT ?? 8080;

mongoose.connection.on('connect', () => {
  console.log('Mongodb connected ....');
});

process.on('SIGINT', () => {
  mongoose.connection.once('disconnect', () => {
    console.log('Mongodb disconnected..... ');
    process.exit(0);
  });
});

const startServer = () => {
  httpServer.listen(port, () => {
    console.log(`⚙️⚡ Server running at http://localhost:${port} 🌟🌟`);
  });
};

httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${port} already in use`);
  } else {
    console.log(`Server error : ${error}`);
  }
});

mongoDbConnection
  .then(() => {
    startServer();
  })
  .catch((err) => {
    console.log('Mongo db connect error: ', err);
  });
