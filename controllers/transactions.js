const Transaction = require("../model/TransactionSchema.js");
const User = require("../model/UserSchema.js");

const transactionIn = async (req, res) => {
  const { senderEmail, receiverEmail } = req.body;
  console.log(req.body);
  try {
    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactionIn = new Transaction({
      ...req.body,
      senderId: sender._id,
      receiverId: receiver._id,
      type: "in",
    });

    await transactionIn.save();
    await sender.save();
    await receiver.save();

    res.status(200).json({ transactionIn });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const transactionOut = async (req, res) => {
  const { senderEmail, receiverEmail } = req.body;

  try {
    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactionOut = new Transaction({
      ...req.body,
      senderId: sender._id,
      receiverId: receiver._id,
      type: "out",
    });

    await transactionOut.save();
    await sender.save();
    await receiver.save();

    res.status(200).json({ transactionOut });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { transactionIn, transactionOut };
