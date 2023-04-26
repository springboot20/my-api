import express from "express";
import { transactionIn } from "../controllers/transactions.js";
import Transaction from "../model/TransactionSchema";

const router = express.Router();

router.post("/transationIn", transactionIn);

router.get("/transactionIn", async (req, res) => {
  console.log(req.body);

  try {
    const results = await Transaction.find();
    res.send(results);
  } catch (error) {
    console.log(error.message);
  }
});

export default router;
