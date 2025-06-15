import { apiResponseHandler, ApiResponse } from "../../middleware/api/api.response.middleware.js";
import { AccountModel, TransactionModel, UserModel } from "../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getAllStatistics = apiResponseHandler(async (req, res) => {
  const { timeframe = "7d", startDate, endDate } = req.query;

  // Calculate date range
  const dateRange = getDateRange(timeframe, startDate, endDate);

  // Run all aggregations in parallel
  const [userStats, accountStats, transactionStats, revenueStats, growthStats] = await Promise.all([
    getUserStatistics(dateRange),
    getAccountStatistics(dateRange),
    getTransactionStatistics(dateRange),
    getRevenueStatistics(dateRange),
    getGrowthStatistics(dateRange),
  ]);

  return new ApiResponse(
    StatusCodes.OK,
    {
      overview: {
        totalUsers: userStats.total,
        totalAccounts: accountStats.total,
        totalTransactions: transactionStats.total,
        totalVolume: transactionStats.totalVolume,
        totalRevenue: revenueStats.total,
      },
      users: userStats,
      accounts: accountStats,
      transactions: transactionStats,
      revenue: revenueStats,
      growth: growthStats,
      generatedAt: new Date(),
      timeframe: timeframe,
      dateRange: dateRange,
    },
    "stats generated successfully"
  );
});

/**
 * User Statistics Aggregation
 */
async function getUserStatistics(dateRange) {
  const pipeline = [
    {
      $facet: {
        // Total users
        total: [{ $count: "count" }],

        // New users in timeframe
        newUsers: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          { $count: "count" },
        ],

        // Users by status
        byStatus: [{ $group: { _id: "$isDeleted", count: { $sum: 1 } } }, { $sort: { count: -1 } }],

        // Users by verification status
        byVerification: [{ $group: { _id: "$isEmailVerified", count: { $sum: 1 } } }],

        // User registration trend (daily)
        registrationTrend: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],

        // Top countries
        // topCountries: [
        //   { $match: { "profile.country": { $exists: true } } },
        //   { $group: { _id: "$profile.country", count: { $sum: 1 } } },
        //   { $sort: { count: -1 } },
        //   { $limit: 10 },
        // ],
      },
    },
  ];

  const result = await UserModel.aggregate(pipeline);
  const data = result[0];

  return {
    total: data.total[0]?.count || 0,
    newUsers: data.newUsers[0]?.count || 0,
    byStatus: data.byStatus,
    verified: data.byVerification.find((item) => item._id === true)?.count || 0,
    unverified: data.byVerification.find((item) => item._id === false)?.count || 0,
    registrationTrend: data.registrationTrend,
    // topCountries: data.topCountries,
  };
}

/**
 * Account Statistics Aggregation
 */
async function getAccountStatistics(dateRange) {
  const pipeline = [
    {
      $lookup: {
        from: "wallets",
        foreignField: "_id",
        localField: "wallet",
        as: "wallet",
      },
    },
    { $addFields: { wallet: { $first: "$wallet" } } },
    {
      $facet: {
        // Total accounts
        total: [{ $count: "count" }],

        // New accounts in timeframe
        newAccounts: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          { $count: "count" },
        ],

        // JavaScript

        // Accounts by type
        byType: [{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }],

        // Accounts by status
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }],

        // Total balance across all accounts
        totalBalance: [{ $group: { _id: null, total: { $sum: "$wallet.balance" } } }],

        // Average balance
        avgBalance: [
          {
            $group: {
              _id: null,
              avg: {
                $avg: "$wallet.balance",
              },
            },
          },
        ],

        // Balance distribution
        balanceDistribution: [
          {
            $bucket: {
              groupBy: "$wallet.balance",
              boundaries: [0, 100, 1000, 5000, 10000, 50000, Number.MAX_VALUE],
              default: "50000+",
              output: { count: { $sum: 1 } },
            },
          },
        ],

        // Account creation trend
        creationTrend: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ];

  const result = await AccountModel.aggregate(pipeline);
  const data = result[0];

  return {
    total: data.total[0]?.count || 0,
    newAccounts: data.newAccounts[0]?.count || 0,
    byType: data.byType,
    byStatus: data.byStatus,
    totalBalance: data.totalBalance[0]?.total || 0,
    averageBalance: data.avgBalance[0]?.avg || 0,
    balanceDistribution: data.balanceDistribution,
    creationTrend: data.creationTrend,
  };
}

/**
 * Transaction Statistics Aggregation
 */
async function getTransactionStatistics(dateRange) {
  const pipeline = [
    {
      $facet: {
        // Total transactions
        total: [{ $count: "count" }],

        // Transactions in timeframe
        timeframeTransactions: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          { $count: "count" },
        ],

        // Total volume
        totalVolume: [{ $group: { _id: null, total: { $sum: "$amount" } } }],

        // Volume in timeframe
        timeframeVolume: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],

        // Transactions by type
        byType: [
          { $group: { _id: "$type", count: { $sum: 1 }, volume: { $sum: "$amount" } } },
          { $sort: { count: -1 } },
        ],

        // Transactions by status
        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 }, volume: { $sum: "$amount" } } },
          { $sort: { count: -1 } },
        ],

        // Average transaction amount
        avgAmount: [{ $group: { _id: null, avg: { $avg: "$amount" } } }],

        // Daily transaction volume trend
        volumeTrend: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
              volume: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ],

        // Hourly distribution
        hourlyDistribution: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          {
            $group: {
              _id: { $hour: "$createdAt" },
              count: { $sum: 1 },
              volume: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ],

        // Top transaction amounts
        topTransactions: [
          { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
          { $sort: { amount: -1 } },
          { $limit: 10 },
          {
            $project: {
              amount: 1,
              type: 1,
              status: 1,
              createdAt: 1,
              // fromAccount: 1,
              // toAccount: 1,
            },
          },
        ],
      },
    },
  ];

  const result = await TransactionModel.aggregate(pipeline);
  const data = result[0];

  return {
    total: data.total[0]?.count || 0,
    timeframeCount: data.timeframeTransactions[0]?.count || 0,
    totalVolume: data.totalVolume[0]?.total || 0,
    timeframeVolume: data.timeframeVolume[0]?.total || 0,
    averageAmount: data.avgAmount[0]?.avg || 0,
    byType: data.byType,
    byStatus: data.byStatus,
    volumeTrend: data.volumeTrend,
    hourlyDistribution: data.hourlyDistribution,
    topTransactions: data.topTransactions,
  };
}

/**
 * Revenue Statistics Aggregation
 */
async function getRevenueStatistics(dateRange) {
  const pipeline = [
    {
      $match: {
        type: { $in: ["fee", "commission", "interest"] },
        status: "completed",
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      },
    },
    {
      $facet: {
        // Total revenue
        total: [{ $group: { _id: null, total: { $sum: "$amount" } } }],

        // Revenue by type
        byType: [
          { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],

        // Daily revenue trend
        dailyTrend: [
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ];

  const result = await TransactionModel.aggregate(pipeline);
  const data = result[0];

  return {
    total: data.total[0]?.total || 0,
    byType: data.byType,
    dailyTrend: data.dailyTrend,
  };
}

/**
 * Growth Statistics
 */
async function getGrowthStatistics(dateRange) {
  const thirtyDaysAgo = new Date(dateRange.start.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [currentPeriod, previousPeriod] = await Promise.all([
    // Current period stats
    Promise.all([
      UserModel.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
      AccountModel.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
      TransactionModel.aggregate([
        { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
        { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: "$amount" } } },
      ]),
    ]),

    // Previous period stats
    Promise.all([
      UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo, $lt: dateRange.start } }),
      AccountModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo, $lt: dateRange.start } }),
      TransactionModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo, $lt: dateRange.start } } },
        { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: "$amount" } } },
      ]),
    ]),
  ]);

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    users: {
      current: currentPeriod[0],
      previous: previousPeriod[0],
      growth: calculateGrowth(currentPeriod[0], previousPeriod[0]),
    },
    accounts: {
      current: currentPeriod[1],
      previous: previousPeriod[1],
      growth: calculateGrowth(currentPeriod[1], previousPeriod[1]),
    },
    transactions: {
      current: currentPeriod[2][0]?.count || 0,
      previous: previousPeriod[2][0]?.count || 0,
      growth: calculateGrowth(currentPeriod[2][0]?.count || 0, previousPeriod[2][0]?.count || 0),
    },
    volume: {
      current: currentPeriod[2][0]?.volume || 0,
      previous: previousPeriod[2][0]?.volume || 0,
      growth: calculateGrowth(currentPeriod[2][0]?.volume || 0, previousPeriod[2][0]?.volume || 0),
    },
  };
}

/**
 * Utility function to calculate date ranges
 */
function getDateRange(timeframe, startDate, endDate) {
  console.log({ timeframe, startDate, endDate });

  const now = new Date();
  let start,
    end = now;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (timeframe) {
      case "7d":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  return { start, end };
}

/**
 * GET /api/stats/users
 * Returns detailed user statistics only
 */
export const usersStatistics = apiResponseHandler(async (req, res) => {
  const { timeframe = "7d", startDate, endDate } = req.query;
  const dateRange = getDateRange(timeframe, startDate, endDate);
  const userStats = await getUserStatistics(dateRange);

  return new ApiResponse(
    StatusCodes.OK,
    {
      data: userStats,
      generatedAt: new Date(),
      timeframe,
      dateRange,
    },
    "stats generated successfully"
  );
});

export const accountsStatistics = apiResponseHandler(async (req) => {
  const { timeframe = "7d", startDate, endDate } = req.query;
  const dateRange = getDateRange(timeframe, startDate, endDate);
  const accountStats = await getAccountStatistics(dateRange);

  return new ApiResponse(
    StatusCodes.OK,
    {
      data: accountStats,
      generatedAt: new Date(),
      timeframe,
      dateRange,
    },
    "stats generated successfully"
  );
});

export const transactionsStatistics = apiResponseHandler(async (req, res) => {
  const { timeframe = "7d", startDate, endDate } = req.query;
  const dateRange = getDateRange(timeframe, startDate, endDate);
  const transactionStats = await getTransactionStatistics(dateRange);

  return new ApiResponse(
    StatusCodes.OK,
    {
      data: transactionStats,
      generatedAt: new Date(),
      timeframe,
      dateRange,
    },
    "stats generated successfully"
  );
});
