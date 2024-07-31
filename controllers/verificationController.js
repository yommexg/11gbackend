// const otpGenerator = require("otp-generator");
// const redis = require("redis");

// const User = require("../model/User");
// const { sendMessage } = require("../sendEmail");

// const redisHost = process.env.REDIS_HOST;
// const redisPort = process.env.REDIS_PORT;
// const redisPassword = process.env.REDIS_PASSWORD;

// const handleNewUserVerification = async (req, res) => {
//   const { email } = req.body;
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   if (!email) {
//     return res.status(400).json({ message: "Email is required" });
//   }

//   if (!emailRegex.test(email)) {
//     return res.status(400).json({ message: "Invalid email format" });
//   }
//   const foundUser = await User.findOne({
//     email,
//   }).exec();

//   if (foundUser && foundUser?.status !== 0) {
//     return res.status(409).json({ message: "Email Already Exists" });
//   }
//   try {
//     const otp = otpGenerator.generate(6, {
//       digits: true,
//       lowerCaseAlphabets: false,
//       upperCaseAlphabets: false,
//       specialChars: false,
//     });

//     const client = redis.createClient({
//       password: redisPassword,
//       socket: {
//         host: redisHost,
//         port: redisPort,
//       },
//     });

//     await client.connect();

//     const sessionId = Math.random().toString(36).substring(2, 15);

//     res.cookie("sessionId", sessionId, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//     });

//     const sessionData = {
//       otp,
//       otpExpiry: new Date(Date.now() + 5 * 60000).toISOString(),
//     };

//     await client.set(sessionId, JSON.stringify(sessionData), "EX", 5 * 60);

//     const succMessage =
//       "Please note that your OTP code is valid for 5 minutes. Ensure to use it within this time frame.";

//     sendMessage(
//       req.body?.email,
//       "Register for 11GAutos",
//       `${otp} ${succMessage}`,
//       "blue"
//     );

//     res.status(200).json({
//       success: `OTP Sent Successfully to ${req.body?.email}`,
//       message: succMessage,
//     });

//     await client.quit();
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const handleOTPRequest = async (req, res) => {
//   const { OTP, email } = req.body;

//   if (!email) return res.status(400).json({ message: "Email is required" });

//   if (!OTP) return res.status(400).json({ message: "OTP Required" });

//   const sessionId = req.cookies.sessionId;

//   if (!sessionId) {
//     return res.status(400).json({ message: "Missing session ID" });
//   }

//   const foundUser = await User.findOne({
//     email,
//   }).exec();

//   try {
//     const client = redis.createClient({
//       password: redisPassword,
//       socket: {
//         host: redisHost,
//         port: redisPort,
//       },
//     });

//     await client.connect();

//     const sessionData = await client.get(sessionId);

//     if (!sessionData) {
//       return res.status(400).json({ message: "Invalid session ID" });
//     }

//     const parsedData = JSON.parse(sessionData);

//     if (OTP !== parsedData.otp || new Date(parsedData.otpExpiry) < new Date()) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     if (foundUser && foundUser.status === 0) {
//       await foundUser.save();
//     } else {
//       await User.create({
//         email,
//       });
//     }

//     await client.del(sessionId);

//     await client.quit();

//     await res
//       .status(201)
//       .json({ success: `OTP Sucessful, You can now Register` });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { handleNewUserVerification, handleOTPRequest };


const otpGenerator = require('otp-generator');
const Otp = require('../model/otp');
const User = require('../model/User');
const { sendMessage } = require('../sendEmail');
const { v4: uuidv4 } = require('uuid'); // To generate session IDs

const handleNewUserVerification = async (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const foundUser = await User.findOne({ email }).exec();

  if (foundUser && foundUser.status !== 0) {
    return res.status(409).json({ message: 'Email Already Exists' });
  }

  try {
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const sessionId = uuidv4(); // Generate a unique session ID

    const otpData = new Otp({
      email,
      otp,
      otpExpiry: new Date(Date.now() + 5 * 60000), // OTP expiry time
      sessionId,
    });

    await otpData.save();

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });

    const succMessage =
      'Please note that your OTP code is valid for 5 minutes. Ensure to use it within this time frame.';

    sendMessage(
      req.body.email,
      'Register for 11GAutos',
      `${otp} ${succMessage}`,
      'blue'
    );

    res.status(200).json({
      success: `OTP Sent Successfully to ${req.body.email}`,
      message: succMessage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const handleOTPRequest = async (req, res) => {
  const { OTP, email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });
  if (!OTP) return res.status(400).json({ message: 'OTP Required' });

  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(400).json({ message: 'Missing session ID' });
  }

  try {
    const otpRecord = await Otp.findOne({ sessionId }).exec();

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    if (OTP !== otpRecord.otp || new Date(otpRecord.otpExpiry) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const foundUser = await User.findOne({ email }).exec();

    if (foundUser && foundUser.status === 0) {
      await foundUser.save();
    } else {
      await User.create({ email });
    }

    await Otp.deleteOne({ sessionId }); // Clean up OTP record

    res.status(201).json({ success: 'OTP Successful, You can now Register' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { handleNewUserVerification, handleOTPRequest };
