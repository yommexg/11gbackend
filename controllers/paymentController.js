const axios = require("axios");
const forge = require("node-forge");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const handlePayWithPayStack = async (req, res) => {
  try {
    const { amount, email, callback_url } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount,
        email,
        callback_url,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

const handlePayWithFlutterwave = async (req, res) => {
  try {
    const { amount, email, redirect_url, userId, phoneNumber, userName } =
      req.body;
    const payload = {
      tx_ref: Date.now(),
      amount,
      currency: "NGN",
      redirect_url,
      payment_type: "card",
      meta: {
        consumer_id: userId,
      },
      customer: {
        email,
        phone_number: phoneNumber,
        name: userName,
      },
      customizations: {
        title: "TeedeePosh",
        description: `Dear TeedeePosh Customer ${userName}, Your Payment has been received`,
      },
    };

    const encryptedPayload = encryptPayload(payload);

    const response = await axios.post(
      "https://api.flutterwave.com/v3/charges?type=card",
      encryptedPayload,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

const encryptPayload = (payload) => {
  const text = JSON.stringify(payload);

  const cipher = forge.cipher.createCipher(
    "3DES-ECB",
    forge.util.createBuffer(ENCRYPTION_KEY)
  );
  cipher.start({ iv: "" });
  cipher.update(forge.util.createBuffer(text, "utf-8"));
  cipher.finish();
  const encrypted = cipher.output;
  return forge.util.encode64(encrypted.getBytes());
};

module.exports = {
  handlePayWithPayStack,
  handlePayWithFlutterwave,
};
