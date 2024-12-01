import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /healthcheck:
 *    get:
 *       summary: Check if the application is up an running
 *       description: Response if the app is up and running
 *       responses:
 *         200:
 *           description: Check if is running well
 *         400:
 *           description: Server could not understand the request due to invalid syntax
 */
router.get("/", (req, res) => res.sendStatus(200));

/**
 * TRANSACTION ROUTES
 */

export default router;
