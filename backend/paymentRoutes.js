const express = require("express");
const router = express.Router();
const pool = require("./db");
const authenticateMerchant = require("./authMiddleware");
const {
  isValidCardNumber,
  isValidExpiry,
  isValidCvv,
  detectCardNetwork
} = require("./validationService");

// Utility: simple delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create Payment API
router.post("/api/v1/payments", authenticateMerchant, async (req, res) => {
  const { order_id, method, vpa, card } = req.body;

  // Basic request validation
  if (!order_id || !method) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "order_id and method are required"
      }
    });
  }

  try {
    // 1. Fetch order
    const orderResult = await pool.query(
      `SELECT id, amount, status
       FROM orders
       WHERE id = $1 AND merchant_id = $2`,
      [order_id, req.merchant.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found"
        }
      });
    }

    const order = orderResult.rows[0];
    // Variables to store card info (NULL for UPI)



    if (order.status !== "created") {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Order is not in created state"
        }
      });
    }

    // Variables to store card info (NULL for UPI)
    let cardLast4 = null;
    let cardNetwork = null;

    // 2. Validate payment method
    if (method === "upi") {
      if (!vpa || !/^[\w.-]+@[\w.-]+$/.test(vpa)) {
        return res.status(400).json({
          error: {
            code: "INVALID_VPA",
            description: "Invalid UPI VPA"
          }
        });
      }

    } else if (method === "card") {
      if (!card || !card.number || !card.expiry || !card.cvv) {
        return res.status(400).json({
          error: {
            code: "INVALID_CARD",
            description: "Missing card details"
          }
        });
      }

      if (!isValidCardNumber(card.number)) {
        return res.status(400).json({
          error: {
            code: "INVALID_CARD",
            description: "Invalid card number"
          }
        });
      }

      if (!isValidExpiry(card.expiry)) {
        return res.status(400).json({
          error: {
            code: "INVALID_CARD",
            description: "Card expired"
          }
        });
      }

      if (!isValidCvv(card.cvv)) {
        return res.status(400).json({
          error: {
            code: "INVALID_CARD",
            description: "Invalid CVV"
          }
        });
      }

      // ✅ IMPORTANT PART (Step 4.3 logic)
      cardLast4 = card.number.slice(-4);
      cardNetwork = detectCardNetwork(card.number);

    } else {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Unsupported payment method"
        }
      });
    }

    // 3. Create payment (processing)
    const paymentId =
      "pay_" + Math.random().toString(36).substring(2, 18);

    await pool.query(
      `INSERT INTO payments (
        id,
        order_id,
        merchant_id,
        method,
        status,
        card_last4,
        card_network
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        paymentId,
        order_id,
        req.merchant.id,
        method,
        "processing",
        cardLast4,
        cardNetwork
      ]
    );

    // 4. Simulate processing delay
    const delayMs = process.env.TEST_PROCESSING_DELAY
      ? Number(process.env.TEST_PROCESSING_DELAY)
      : 3000;

    await delay(delayMs);

    // 5. Decide success/failure
    let success;
    if (process.env.TEST_MODE === "true") {
      success = process.env.TEST_PAYMENT_SUCCESS === "true";
    } else {
      success = Math.random() > 0.3;
    }

    const finalStatus = success ? "success" : "failed";

    await pool.query(
      `UPDATE payments SET status = $1 WHERE id = $2`,
      [finalStatus, paymentId]
    );

    return res.status(200).json({
      id: paymentId,
      order_id,
      status: finalStatus,
      amount: order.amount,
      currency: "INR",
      method
    });

  } catch (error) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Payment failed"
      }
    });
  }
});
// Get all payments for merchant (Transactions page)
router.get("/api/v1/payments", authenticateMerchant, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.order_id,
        o.amount,
        p.status,
        p.method,
        p.created_at
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.merchant_id = $1
      ORDER BY p.created_at DESC
      `,
      [req.merchant.id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to fetch payments"
      }
    });
  }
});

module.exports = router;
