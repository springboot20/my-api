export const getLocalFilePath = (filename) =>
  `./public/images/${filename}`;

export const getStaticFilePath = (req, filename) =>
  `${req.protocol}://${req.get("host")}/${filename}`;
