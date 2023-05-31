const bodyParser = require("body-parser");
const express = require("express");
const userRouter = require("./routes/users.js");
const transactionRouter = require("./routes/transactions.js");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const auth = require("./utils/auth.js");

const app = express();

dotenv.config();
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: process.env.DBNAME,
    user: process.env.USER,
    pass: process.env.PASS,
  })
  .then(() => {
    console.log("Mongodb connected.....");
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/transactions", auth, transactionRouter);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Headers", "*");
  res.send("Hello world from home page");
  res.sendFile(`${__dirname}/index.html`);
});

app.use((req, res, next) => {
  const err = new Error("Not found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
  next(err);
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running at port : http://localhost:${process.env.PORT}`);
});
