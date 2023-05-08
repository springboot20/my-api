const express = require("express");
const {
  transactionIn,
  transactionOut,
} = require("../controllers/transactions.js");
const Transaction = require("../model/TransactionSchema.js");
const auth = require("../utils/auth.js");

const router = express.Router();

router.post("/transactionIn", auth, transactionIn);
router.post("/transactionOut", auth, transactionOut);

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
