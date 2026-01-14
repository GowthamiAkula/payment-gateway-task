const express = require("express");
const crypto = require("crypto");

const app = express();

// 🔴 IMPORTANT: capture RAW body
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

const WEBHOOK_SECRET = "7de48bc822f492d5d446e6066181aa7cd5f9c553bc7a6ef5"; // from DB

app.post("/webhook", (req, res) => {
  const signature = req.header("X-Webhook-Signature");

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.log("❌ Invalid signature");
    return res.status(400).send("Invalid signature");
  }

  console.log("✅ Webhook verified");
  console.log("📦 Payload:", req.body);

  res.status(200).send("OK");
});

app.listen(4000, () => {
  console.log("Test merchant webhook running on port 4000");
});
