const bodyParser = require("body-parser");
const express = require("express");
const userRouter = require("./routes/users.js");
const transactionRouter = require("./routes/transactions.js");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;

mongoose
  .connect("mongodb+srv://cluster0.prjuarl.mongodb.net/", {
    dbName: "My_Rest_Api",
    user: "springboot",
    pass: "GexId4yCJi2JThY2",
  })
  .then(() => {
    console.log("Mongodb connected.....");
  });

const corsConfig = {
  credentials: true,
  origin: true,
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(corsConfig));

app.use("/users", userRouter);
app.use("/transactions", transactionRouter);

app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Headers", "*");
  res.send("Hello world from home page");
});

app.use((err, req, res, next) => {});

app.listen(PORT, () => {
  console.log(`Server running at port : http://localhost:${PORT}`);
});
