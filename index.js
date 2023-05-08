const bodyParser = require("body-parser");
const express = require("express");
const userRouter = require("./routes/users.js");
const transactionRouter = require("./routes/transactions.js");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();
const PORT = 5000;

dotenv.config();
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: "My_Rest_Api",
    user: "springboot",
    pass: "GexId4yCJi2JThY2",
  })
  .then(() => {
    console.log("Mongodb connected.....");
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/transactions", transactionRouter);

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

app.listen(PORT, () => {
  console.log(`Server running at port : http://localhost:${PORT}`);
});
