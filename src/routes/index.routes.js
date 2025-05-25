import * as healthcheck from "./health/health.routes.js";
import * as authRoutes from "./auth/user.routes.js";
import * as accountRoutes from "./bank/account/account.routes.js";
import * as transactionRoutes from "./bank/transaction/transaction.routes.js";
import * as statisticRoutes from "./statistics/statistics.routes.js";
import * as profileRoutes from "./auth/profile.routes.js";
import * as cardRoutes from "./bank/card/card.routes.js";
import * as messageRoutes from "./messages/messages.routes.js";

export {
  healthcheck,
  authRoutes,
  accountRoutes,
  transactionRoutes,
  statisticRoutes,
  profileRoutes,
  cardRoutes,
  messageRoutes
};
