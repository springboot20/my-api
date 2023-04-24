import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
  try {
    const token = re.headers.authorization.split(" ")[1];
    const isCustomAUth = token.length < 500;

    let decodedData;
    if (token && isCustomAUth) {
      decodedData = jwt.verify(token, "secret");
      re.userId = decodedData?.id;
    }
    next();
  } catch (error) {
    console.log(`auth middleware error ${error}`);
  }
};
export default auth;
