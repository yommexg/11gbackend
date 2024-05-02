require("dotenv").config();

const express = require("express");
const session = require("express-session");
const app = express();
const path = require("path");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const crendentials = require("./middleware/credentials");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");
const multer = require("multer");
const cron = require("node-cron");

const {
  deleteUnregisteredUsers,
} = require("./controllers/deleteUnregController");

const PORT = process.env.PORT || 5000;

// connect to mongo database
connectDB();

deleteUnregisteredUsers();

cron.schedule("0 0 * * *", deleteUnregisteredUsers);

// setInterval(deleteInactiveUsers, 60 * 1000);

// custom middleware logger
app.use(logger);

// Handle option crendentials check - before CORS
// and fetch cookies crendentials requirement
app.use(crendentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware for form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// routes
app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));
app.use("/verify-email", require("./routes/verification"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
app.use("/forget-password", require("./routes/forgotPassword"));

app.use("/availiable-new-cars", require("./routes/newCars"));
app.use("/availiable-used-cars", require("./routes/usedCars"));
app.use("/availiable-car-ass", require("./routes/carAss"));
// app.use("/payment", require("./routes/payment"));

app.use(verifyJWT);
app.use("/users", require("./routes/api/admin/getAllUsers"));
app.use("/new-cars", require("./routes/api/admin/newCar"));
app.use("/used-cars", require("./routes/api/admin/usedCar"));
app.use("/", require("./routes/api/users/usedCar"));
app.use("/car-ass", require("./routes/api/admin/carAss"));
app.use("/complete-user-deletion", require("./routes/api/admin/deleteUser"));
app.use("/update-user-status", require("./routes/api/admin/updateStatus"));

app.use("/user", require("./routes/api/users/user"));
app.use("/used-car", require("./routes/api/users/usedCar"));
app.use("/upload-avatar", require("./routes/api/users/uploadAvatar"));
app.use("/delete-user", require("./routes/api/users/deleteUser"));

// Multer middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.json({
        message: "file is too large",
      });
    } else if (error.code === "LIMIT_FILE_COUNT") {
      return res.json({
        message: "file limit reached",
      });
    } else if (error.code === "LIMIT_FIELD_KEY") {
      return res.json({
        message: "Wrong file name",
      });
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.json({
        message: "File must be an image / Enter the right key",
      });
    }
  }
});

// error handler
app.use(errorHandler);

mongoose.set("strictQuery", false);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
