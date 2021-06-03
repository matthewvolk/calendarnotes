const NextUser = require("../models/NextUser");
const jwt = require("jsonwebtoken");

const jwtQuery = async (request, response, next) => {
  const { token } = request.query;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log("Could not decode token", err);
    response.status(401).send("Unauthorized");
    return;
  }
  const user = await NextUser.findOne({ id: decoded.id }).exec();
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
  jwtQuery,
};
