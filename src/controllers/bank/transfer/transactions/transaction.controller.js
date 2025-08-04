import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { formatDate, formatMoney } from "../../../../utils/index.js";

const getPipelineData = () => {
  return [
    // lookup for user related to a transaction
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "user",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              fisrtname: 1,
              lastname: 1,
            },
          },
        ],
      },
    },

    // lookup for account related to transaction
    {
      $lookup: {
        from: "accounts",
        foreignField: "_id",
        localField: "account",
        as: "account",
        pipeline: [
          {
            $project: {
              account_number: 1,
              type: 1,
              status: 1,
            },
          },
        ],
      },
    },

    // add field for user and account looked up for
    {
      $addFields: {
        user: { $first: "$user" },
        account: { $first: "$account" },
      },
    },
  ];
};

export const getTransactionById = apiResponseHandler(async (req, res) => {
  const { transactionId } = req.query;

  const transactionDetails = await TransactionModel.aggregate([
    {
      $match: transactionId
        ? {
            _id: new mongoose.Types.ObjectId(transactionId),
          }
        : {},
    },
    ...getPipelineData(),
  ]);

  if (!transactionDetails) {
    throw new CustomErrors("failed to fetch transaction details.", StatusCodes.BAD_REQUEST);
  }

  return new ApiResponse(
    StatusCodes.OK,
    transactionDetails[0],
    "transaction details fetched successfully"
  );
});

export const deleteTransactionById = apiResponseHandler(async (req, res) => {
  const { transactionId } = req.query;

  const objectId = new mongoose.Types.ObjectId(transactionId);

  const deletedTransaction = await TransactionModel.findByIdAndDelete(objectId);

  if (!deletedTransaction) {
    throw new CustomErrors(
      "Transaction not found. Failed to delete transaction.",
      StatusCodes.BAD_REQUEST
    );
  }

  return new ApiResponse(StatusCodes.OK, {}, "transaction deleted successfully");
});

export const downloadTransactionById = apiResponseHandler(async (req, res) => {
  const { transactionId } = req.params;

  const transaction = await TransactionModel.findById(transactionId).populate(
    "user",
    "_id email firstname lastname"
  );

  if (!transaction) {
    throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
  }

  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // Set response headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="receipt-${transaction.reference}.pdf"`
  );

  // Pipe the PDF to the response
  doc.pipe(res);

  // Header
  doc.fontSize(20).text("Transaction Receipt", { align: "center" });
  doc.moveDown();

  // Company/App Info (customize as needed)
  doc
    .fontSize(12)
    .text("YourApp Financial Services", { align: "center" })
    .text("Transaction Receipt", { align: "center" })
    .moveDown();

  // Transaction Details
  doc.fontSize(14).text("Transaction Details", { underline: true });
  doc.moveDown(0.5);

  const details = [
    ["Reference:", transaction.reference],
    [
      "Amount:",
      formatMoney(
        transaction.amount,
        transaction.currency || "NGN",
        transaction.currency === "NGN" ? "en-NG" : "en-US"
      ),
    ],
    ["Type:", transaction.type],
    ["Status:", transaction.status],
    ["Description:", transaction.description || "N/A"],
    ["Gateway:", transaction.detail?.gateway || "N/A"],
    [
      "Date Created:",
      formatDate(transaction.createdAt).date + " " + formatDate(transaction.createdAt).time,
    ],
    [
      "Date Updated:",
      formatDate(transaction.updatedAt).date + " " + formatDate(transaction.updatedAt).time,
    ],
  ];

  details.forEach(([label, value]) => {
    doc.fontSize(10).text(label, 50, doc.y, { width: 120, continued: true }).text(value, 170);
    doc.moveDown(0.3);
  });

  doc.moveDown();

  // Account Information
  if (transaction.detail?.senderAccountNumber || transaction.detail?.receiverAccountNumber) {
    doc.fontSize(14).text("Account Information", { underline: true });
    doc.moveDown(0.5);

    if (transaction.detail.senderAccountNumber) {
      doc
        .fontSize(10)
        .text("Sender Account:", 50, doc.y, { width: 120, continued: true })
        .text(transaction.detail.senderAccountNumber, 170);
      doc.moveDown(0.3);
    }

    if (transaction.detail.receiverAccountNumber) {
      doc
        .fontSize(10)
        .text("Receiver Account:", 50, doc.y, { width: 120, continued: true })
        .text(transaction.detail.receiverAccountNumber, 170);
      doc.moveDown(0.3);
    }
  }

  doc.moveDown();

  // User Information
  if (transaction.user) {
    doc.fontSize(14).text("User Information", { underline: true });
    doc.moveDown(0.5);

    const userDetails = [
      ["Name:", `${transaction.user.firstname} ${transaction.user.lastname}`],
      ["Email:", transaction.user.email],
      ["User ID:", transaction.user._id.toString()],
    ];

    userDetails.forEach(([label, value]) => {
      doc.fontSize(10).text(label, 50, doc.y, { width: 120, continued: true }).text(value, 170);
      doc.moveDown(0.3);
    });
  }

  doc.moveDown();

  // Footer
  doc
    .fontSize(8)
    .text("This is an electronically generated receipt.", { align: "center" })
    .text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });

  // Finalize the PDF
  doc.end();
});

// Get receipt data for sharing (returns JSON)
export const getReceiptData = apiResponseHandler(async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    throw new CustomErrors("Transaction ID is required", StatusCodes.BAD_REQUEST);
  }

  const transaction = await TransactionModel.findById(transactionId).populate(
    "user",
    "firstname lastname email"
  );

  if (!transaction) {
    throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
  }

  const receiptData = {
    reference: transaction.reference,
    amount: formatMoney(
      transaction.amount,
      transaction.currency || "NGN",
      transaction.currency === "NGN" ? "en-NG" : "en-US"
    ),
    type: transaction.type,
    status: transaction.status,
    description: transaction.description,
    gateway: transaction.detail?.gateway,
    createdAt: formatDate(transaction.createdAt),
    updatedAt: formatDate(transaction.updatedAt),
    senderAccount: transaction.detail?.senderAccountNumber,
    receiverAccount: transaction.detail?.receiverAccountNumber,
    user: transaction.user
      ? {
          name: `${transaction.user.firstname} ${transaction.user.lastname}`,
          email: transaction.user.email,
        }
      : null,
    shareUrl: `${req.protocol}://${req.get("host")}/receipt/${transaction._id}`,
    shareText: `Transaction Receipt - ${transaction.reference}\nAmount: ${formatMoney(
      transaction.amount,
      transaction.currency || "NGN"
    )}\nStatus: ${transaction.status}`,
  };

  return res.status(StatusCodes.OK).json({
    success: true,
    data: receiptData,
    message: "Receipt data retrieved successfully",
  });
});
