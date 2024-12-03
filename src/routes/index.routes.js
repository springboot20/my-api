import * as healthcheck from "./health/health.routes.js";
import * as authRoutes from "./auth/user.routes.js";
import * as accountRoutes from "./bank/account/account.routes.js";
import * as transactionRoutes from "./bank/transaction/transaction.routes.js";
import * as statisticRoutes from "./bank/statistics/statistics.routes.js";

export { healthcheck, authRoutes, accountRoutes, transactionRoutes,statisticRoutes };
