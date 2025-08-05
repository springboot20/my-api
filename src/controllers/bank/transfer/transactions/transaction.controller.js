import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { formatDate, formatMoney } from "../../../../utils/index.js";
import { PassThrough } from "stream";

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

// Function to generate PDF content
const generatePDFContent = (doc, transaction) => {
  // Colors
  const primaryColor = "#2563eb";
  const grayColor = "#6b7280";

  doc.font("Helvetica");

  // Header with company info
  doc.fontSize(24).fillColor(primaryColor).text("TRANSACTION RECEIPT", { align: "center" });

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor(grayColor)
    .text("YourApp Financial Services", { align: "center" })
    .text("Electronic Receipt", { align: "center" });

  doc.moveDown(1);

  // Add a line separator
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(1);

  // Transaction amount (prominent display)
  doc
    .fontSize(20)
    .fillColor(primaryColor)
    .text(
      formatMoney(
        transaction.amount,
        transaction.currency || "NGN",
        transaction.currency === "NGN" ? "en-NG" : "en-US"
      ),
      { align: "center" }
    );

  doc
    .fontSize(12)
    .fillColor(grayColor)
    .text(`${transaction.type} Transaction`, { align: "center" });

  doc.moveDown(1);

  // Status badge
  const statusColor = getStatusColor(transaction.status);
  doc
    .fontSize(10)
    .fillColor(statusColor)
    .text(`STATUS: ${transaction.status}`, { align: "center" });

  doc.moveDown(1.5);

  // Transaction Details Section
  addSection(doc, "TRANSACTION DETAILS");

  const details = [
    ["Reference Number", transaction.reference],
    [
      "Amount",
      formatMoney(
        transaction.amount,
        transaction.currency || "NGN",
        transaction.currency === "NGN" ? "en-NG" : "en-US"
      ),
    ],
    ["Transaction Type", transaction.type],
    ["Status", transaction.status],
    ["Description", transaction.description || "N/A"],
    ["Payment Gateway", transaction.detail?.gateway || "N/A"],
    [
      "Date Created",
      formatDate(transaction.createdAt).date + " at " + formatDate(transaction.createdAt).time,
    ],
    [
      "Last Updated",
      formatDate(transaction.updatedAt).date + " at " + formatDate(transaction.updatedAt).time,
    ],
  ];

  addDetailRows(doc, details);

  // Account Information Section (if available)
  if (transaction.detail?.senderAccountNumber || transaction.detail?.receiverAccountNumber) {
    doc.moveDown(1);
    addSection(doc, "ACCOUNT INFORMATION");

    const accountDetails = [];
    if (transaction.detail?.senderAccountNumber) {
      accountDetails.push(["Sender Account", transaction.detail.senderAccountNumber]);
    }
    if (transaction.detail?.receiverAccountNumber) {
      accountDetails.push(["Receiver Account", transaction.detail.receiverAccountNumber]);
    }

    addDetailRows(doc, accountDetails);
  }

  // User Information Section
  if (transaction.user) {
    doc.moveDown(1);
    addSection(doc, "USER INFORMATION");

    const userDetails = [
      [
        "Full Name",
        `${transaction.user.firstname || ""} ${transaction.user.lastname || ""}`.trim(),
      ],
      ["Email Address", transaction.user.email],
      ["User ID", transaction.user._id.toString()],
    ];

    addDetailRows(doc, userDetails);
  }

  // Footer
  doc.moveDown(2);

  // Add a line separator
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .fillColor(grayColor)
    .text("This is an electronically generated receipt. No signature required.", {
      align: "center",
    });

  doc.text(
    `Generated on ${new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })}`,
    { align: "center" }
  );
};

// Helper function to add section headers
const addSection = (doc, title) => {
  doc.fontSize(14).fillColor("#111827").text(title, { underline: false });

  // Add underline manually
  const titleWidth = doc.widthOfString(title);
  doc
    .strokeColor("#2563eb")
    .lineWidth(2)
    .moveTo(50, doc.y + 2)
    .lineTo(50 + titleWidth, doc.y + 2)
    .stroke();

  doc.moveDown(0.8);
};

// Helper function to add detail rows
const addDetailRows = (doc, details) => {
  details.forEach(([label, value]) => {
    const currentY = doc.y;

    // Label
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(label + ":", 50, currentY, { width: 150 });

    // Value
    doc
      .fontSize(10)
      .fillColor("#111827")
      .text(value || "N/A", 220, currentY, { width: 275 });

    doc.moveDown(0.5);
  });
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "COMPLETED":
      return "#059669";
    case "FAILED":
      return "#dc2626";
    case "PENDING":
      return "#d97706";
    case "IN_PROGRESS":
      return "#7c3aed";
    default:
      return "#6b7280";
  }
};

// Separate function to generate PDF buffer
const generateTransactionPDF = (transaction) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: `Transaction Receipt - ${transaction.reference}`,
          Subject: "Transaction Receipt",
          Author: "YourApp Financial Services",
        },
      });
      const passthrough = new PassThrough();
      const chunks = [];

      // Collect PDF data
      passthrough.on("data", (chunk) => chunks.push(chunk));
      passthrough.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      passthrough.on("error", (err) => {
        console.error("PDF doc error:", err);
        reject(err);
      });

      doc.pipe(passthrough);
      // Start generating content
      generatePDFContent(doc, transaction);

      // Finalize the document
      doc.end();
    } catch (error) {
      console.error("PDF generation setup error:", error);
      reject(error);
    }
  });
};

export const downloadTransactionById = apiResponseHandler(async (req, res) => {
  const { transactionId } = req.params;

  const transaction = await TransactionModel.findById(transactionId).populate(
    "user",
    "_id email firstname lastname"
  );

  if (!transaction) {
    throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
  }

  // Generate PDF in memory first
  const pdfBuffer = await generateTransactionPDF(transaction);

  // Set headers and send buffer
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="receipt-${transaction.reference}.pdf"`
  );

  return res.send(pdfBuffer);
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
