const express = require("express");
const transactionIn = require("../controllers/transactions.js");
const Transaction = require("../model/TransactionSchema.js");

const router = express.Router();

router.post("/transactionIn", transactionIn);

router.get("/transactionIn", async (req, res) => {
  console.log(req.body);

  try {
    const results = await Transaction.find();
    res.send(results);
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
