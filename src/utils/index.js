import { dirname } from "path";
import * as url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getLocalFilePath = (filename) =>
  `${__dirname}/public/uploads/${filename}`;

export const getStaticFilePath = (req, filename) =>
  `${req.get("protocol")}://${req.get("host")}/${filename}`;
