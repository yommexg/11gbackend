// const jwt = require("jsonwebtoken");

// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization || req.headers.Authorization;
//   if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401); // unauthorized
//   // console.log(authHeader); // Bearer token
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
//     if (err) return res.sendStatus(403); // invalid token
//     console.log(err);
//     req.user = decoded.UserInfo.username;
//     req.roles = decoded.UserInfo.roles;
//     next();
//   });
// };

// module.exports = verifyJWT;

const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  let token;

  // Check if the request has an Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Extract the token from the Authorization header
    token = authHeader.split(" ")[1];
  } else {
    // Check if the request has a cookie named "jwt"
    token = req.cookies?.jwt;
  }

  // If no token is found, send 401 Unauthorized
  if (!token) return res.sendStatus(401);

  // Verify the token (whether it's an access token or a refresh token)
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      // If token is invalid, send 403 Forbidden
      console.error("Token verification error:", err);
      return res.sendStatus(403);
    }

    // Token is valid, extract user information
    req.user = decoded.UserInfo.username;
    req.roles = decoded.UserInfo.roles;
    next();
  });
};

module.exports = verifyJWT;
