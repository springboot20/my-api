import multer from "multer";
import DatauriParser from "datauri/parser.js";
import path from "path";

const storage = multer.memoryStorage({});

const multerUploads = multer({
  storage,
  limits: {
    fileSize: 2 * 1000 * 1000,
  },
});

/**
 * @description This function converts the buffer to data url
 * @param {Object} req containing the field object
 * @returns {String} The data url from the string buffer
 */
const dataUri = (req) => {
  const file = req.file;
  const parser = new DatauriParser();
  const ext = path.extname(file.originalname);

  return parser.format(ext, file.buffer);
};

export { multerUploads, dataUri };
