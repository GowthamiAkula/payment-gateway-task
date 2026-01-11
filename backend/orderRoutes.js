const express = require("express");
const router = express.Router();
const pool = require("./db");
const authenticateMerchant = require("./authMiddleware");

/**
 * 1️⃣ CREATE ORDER
 * POST /api/v1/orders
 */
router.post("/api/v1/orders", authenticateMerchant, async (req, res) => {
  const { amount, currency = "INR" } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Amount must be at least 100 paise"
      }
    });
  }

  const orderId = "order_" + Math.random().toString(36).substring(2, 18);

  try {
    await pool.query(
      `INSERT INTO orders (id, merchant_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, req.merchant.id, amount, currency, "created"]
    );

    return res.status(201).json({
      id: orderId,
      amount,
      currency,
      status: "created"
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to create order"
      }
    });
  }
});

/**
 * 2️⃣ GET ALL ORDERS
 * GET /api/v1/orders
 */
router.get("/api/v1/orders", authenticateMerchant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, amount, currency, status
       FROM orders
       WHERE merchant_id = $1
       ORDER BY created_at DESC`,
      [req.merchant.id]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to fetch orders"
      }
    });
  }
});

/**
 * 3️⃣ GET SINGLE ORDER
 * GET /api/v1/orders/:orderId
 */
router.get("/api/v1/orders/:orderId", authenticateMerchant, async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, amount, currency, status
       FROM orders
       WHERE id = $1 AND merchant_id = $2`,
      [orderId, req.merchant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found"
        }
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to fetch order"
      }
    });
  }
});
// List Orders API (for Transactions page)
router.get("/api/v1/orders", authenticateMerchant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         o.id,
         o.amount,
         o.currency,
         o.status,
         o.created_at
       FROM orders o
       WHERE o.merchant_id = $1
       ORDER BY o.created_at DESC`,
      [req.merchant.id]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to fetch orders"
      }
    });
  }
});

module.exports = router;
