import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

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

app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Headers", "*");
  res.send("Hello world from home page");
});

app.listen(PORT, () => {
  console.log(`Server running at port : http://localhost:${PORT}`);
});
