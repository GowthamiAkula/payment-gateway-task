require("dotenv").config();

const express = require("express");
const pool = require("./db");
const authenticateMerchant = require("./authMiddleware");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");

const app = express();
const PORT = process.env.SERVER_PORT || 8000;

// Middleware to parse JSON
app.use(express.json());
const cors = require("cors");
app.use(cors());

app.use(orderRoutes);
app.use(paymentRoutes);

// Health check endpoint (with DB check)
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "not connected"
    });
  }
});
app.get("/protected", authenticateMerchant, (req, res) => {
  res.status(200).json({
    message: "Authentication successful",
    merchant: {
      id: req.merchant.id,
      name: req.merchant.name
    }
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
