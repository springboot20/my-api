import * as path from "path";
import * as url from "url";

const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const getLocalFilePath = (filename) => `./public/images/${filename}`;

export const getStaticFilePath = (req, filename) =>
  `${req.protocol}://${req.get("host")}/${filename}`;

/**
 *
 * @param {number} amount
 * @returns number
 */
export const convertToKobo = (amount) => amount * 100;
