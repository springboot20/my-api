import mongoose from "mongoose";

console.log(process.env.NODE_ENV);

const connectString =
  process.env.NODE_ENV === "production" ? process.env.MONGODB_URI : process.env.MONGODB_URI_LOCAL;
const connectionCredentials =
  process.env.NODE_ENV === "production"
    ? {
        dbName: process.env.DBNAME,
        user: process.env.USER,
        pass: process.env.PASS,
      }
    : {
        dbName: process.env.DBNAME,
      };
const mongoDbConnection = async () => {
  try {
    const connectionInstance = await mongoose.connect(connectString, connectionCredentials);
    console.log(`\n☘️  MongoDB connected successfully: ${connectionInstance.connection.host}\n`);
  } catch (error) {
    console.log(error);
  }
};

export default mongoDbConnection;
