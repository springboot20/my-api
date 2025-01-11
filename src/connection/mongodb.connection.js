import mongoose from "mongoose";

console.log(process.env.NODE_ENV)
const mongoDbConnection = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI_LOCAL, {
      dbName: process.env.DBNAME,
      // user: process.env.USER,
      // pass: process.env.PASS,
    });

    console.log(`\n☘️  MongoDB connected successfully: ${connectionInstance.connection.host}\n`);
  } catch (error) {
    console.log(error);
  }
};

export default mongoDbConnection;
