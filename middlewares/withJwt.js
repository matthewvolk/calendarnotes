const NextUser = require("../models/NextUser");
const jwt = require("jsonwebtoken");

const withJwt = async (request, response, next) => {
  const token = request.headers.authorization.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, "SECRET");
  } catch (err) {
    console.log("Could not decode token", err);
    response.status(401).send("Unauthorized");
    return;
  }
  console.log("withJwt.js decoded:", decoded);
  const user = await NextUser.findOne({ id: decoded.id }).exec();
  console.log("withJwt.js user:", user);
  if (!user) {
    response.status(401).send("Unauthorized");
    return;
  }
  if (user) {
    request.user = user;
    return next();
  }
};

module.exports = {
  withJwt,
};
