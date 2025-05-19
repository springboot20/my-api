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

/**
 *
 * @param {number} limit
 * @returns {mongoose.PaginateOptions}
 */
export const getMognogoosePagination = ({ limit = 10, page = 1, customLabels }) => {
  return {
    limit: Math.max(limit, 1),
    page: Math.max(page, 1),
    customLabels: {
      pagingCounter: "serial_counter",
      ...customLabels,
    },
  };
};