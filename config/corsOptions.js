// const allowedOrigins = require("./allowedOrigins");

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   optionSuccessStatus: 200,
//   credentials: true,
// };

// module.exports = corsOptions;

const allowedOrigins = require("./allowedOrigins");

const isAllowedOrigin = (origin) => {
  // Check if the origin is in the allowedOrigins array
  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || !isAllowedOrigin(origin)) {
      // Reject requests with disallowed origins
      callback(new Error("Not allowed by CORS"));
    } else {
      callback(null, true);
    }
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

module.exports = corsOptions;
