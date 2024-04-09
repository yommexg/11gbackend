const User = require("../model/User");
const bcrypt = require("bcrypt");
const { sendMessage } = require("../sendEmail");

const handleNewUser = async (req, res) => {
  const { user, pwd, email, phoneNumber, address } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const foundUser = await User.findOne({
    email,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Email is Not Authenticated" });
  }

  if (foundUser && foundUser.status !== 0) {
    return res.status(401).json({ message: "User Already Exist" });
  }

  if (!user) return res.status(400).json({ message: "Username is required" });

  if (!pwd) return res.status(400).json({ message: "Password is required" });

  if (!phoneNumber)
    return res.status(400).json({ message: "Phone Number is required" });

  if (!address) return res.status(400).json({ message: "Address is required" });
  else if (
    typeof address !== "object" ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.country ||
    !address.houseNo
  ) {
    return res
      .status(400)
      .json({ message: "Invalid Address format / Missing Address details" });
  }

  if (foundUser) {
    try {
      // encrypt the password
      const hashedPwd = await bcrypt.hash(pwd, 10);

      foundUser.username = user;
      foundUser.password = hashedPwd;
      foundUser.phoneNumber = phoneNumber;
      foundUser.address = address;
      foundUser.status = 1;

      await foundUser.save();

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Account Registered Successfully`,
            `User ${user} with email ${email} account has been registered`,
            "#E30B5D"
          );
        }
      }

      const message = `Congratulations ${user}, Your Account is Registered with 11GAutos`;

      await sendMessage(
        req.body?.email,
        "Registration Sussessful",
        message,
        "green"
      );

      res.status(201).json({
        success: message,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = { handleNewUser };
