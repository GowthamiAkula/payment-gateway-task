require("dotenv").config();

// 🔑 Initialize Redis connection
require("./redis");

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const pool = require("./db");
const authenticateMerchant = require("./authMiddleware");

// ✅ Import routes
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const refundRoutes = require("./refundRoutes");
const webhookRoutes = require("./webhookRoutes");
const jobRoutes = require("./jobRoutes");

// ✅ Create app
const app = express();
const PORT = process.env.SERVER_PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Register routes
app.use(orderRoutes);
app.use(paymentRoutes);
app.use(refundRoutes);
app.use(webhookRoutes);
app.use(jobRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch {
    res.status(500).json({
      status: "error",
      database: "not connected"
    });
  }
});

// Protected test
app.get("/protected", authenticateMerchant, (req, res) => {
  res.json({
    message: "Authentication successful",
    merchant: req.merchant
  });
});

// 🔔 Configure Webhook
app.post("/api/v1/webhooks/config", authenticateMerchant, async (req, res) => {
  const { webhook_url } = req.body;

  if (!webhook_url) {
    return res.status(400).json({
      error: { code: "BAD_REQUEST", description: "webhook_url is required" }
    });
  }

  const webhookSecret = crypto.randomBytes(24).toString("hex");

  await pool.query(
    `
    UPDATE merchants
    SET webhook_url = $1, webhook_secret = $2
    WHERE id = $3
    `,
    [webhook_url, webhookSecret, req.merchant.id]
  );

  res.json({
    message: "Webhook configured successfully",
    webhook_url,
    webhook_secret: webhookSecret
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
