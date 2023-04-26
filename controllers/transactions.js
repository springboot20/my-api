import Transaction from "../model/TransactionSchema.js";
import User from "../model/UserSchema.js";

export const transactionIn = async (req, res) => {
  const { senderId, receiverId, amount } = req.body;
  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactionIn = new Transaction({
      senderId,
      senderEmail: sender.email,
      receiverId,
      receiverEmail: receiver.email,
      amount,
    });

    await transactionIn.save();

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.send({ transaction: transactionIn });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};
