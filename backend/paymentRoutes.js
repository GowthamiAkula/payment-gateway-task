const express = require("express");
const router = express.Router();
const pool = require("./db");
const authenticateMerchant = require("./authMiddleware");
const redisClient = require("./redis");
const {
  isValidCardNumber,
  isValidExpiry,
  isValidCvv,
  detectCardNetwork
} = require("./validationService");

/**
 * ================================
 * CREATE PAYMENT (ASYNC)
 * ================================
 */
router.post("/api/v1/payments", authenticateMerchant, async (req, res) => {
  const { order_id, method, vpa, card } = req.body;

  if (!order_id || !method) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "order_id and method are required"
      }
    });
  }

  try {
    // 1️⃣ Fetch order
    const orderResult = await pool.query(
      `
      SELECT id, amount, status
      FROM orders
      WHERE id = $1 AND merchant_id = $2
      `,
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

    if (order.status !== "created") {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Order is not in created state"
        }
      });
    }

    // 2️⃣ Validate payment method
    let cardLast4 = null;
    let cardNetwork = null;

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

    // 3️⃣ Create payment (PENDING)
    const paymentId = "pay_" + Math.random().toString(36).substring(2, 18);

    await pool.query(
      `
      INSERT INTO payments (
        id,
        order_id,
        merchant_id,
        method,
        status,
        card_last4,
        card_network
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        paymentId,
        order_id,
        req.merchant.id,
        method,
        "pending",
        cardLast4,
        cardNetwork
      ]
    );

    // 4️⃣ Enqueue job
    await redisClient.lPush(
      "payment_jobs",
      JSON.stringify({
        type: "PROCESS_PAYMENT",
        payment_id: paymentId
      })
    );

    // 5️⃣ Async response
    return res.status(202).json({
      id: paymentId,
      order_id,
      status: "pending",
      message: "Payment is being processed"
    });

  } catch (err) {
    console.error("Payment error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Payment initiation failed"
      }
    });
  }
});

/**
 * ================================
 * LIST PAYMENTS
 * ================================
 */
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

    return res.status(200).json(
      result.rows.map(row => ({
        ...row,
        amount: Number(row.amount)
      }))
    );

  } catch (err) {
    console.error("Fetch payments error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to fetch payments"
      }
    });
  }
});


/**
 * ================================
 * CAPTURE PAYMENT
 * ================================
 */
router.post(
  "/api/v1/payments/:id/capture",
  authenticateMerchant,
  async (req, res) => {
    const paymentId = req.params.id;

    try {
      // 1️⃣ Fetch payment
      const result = await pool.query(
        `
        SELECT id, status, captured
        FROM payments
        WHERE id = $1 AND merchant_id = $2
        `,
        [paymentId, req.merchant.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            description: "Payment not found"
          }
        });
      }

      const payment = result.rows[0];

      // 2️⃣ Validate state
      if (payment.status !== "success") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATE",
            description: "Only successful payments can be captured"
          }
        });
      }

      if (payment.captured) {
        return res.status(400).json({
          error: {
            code: "ALREADY_CAPTURED",
            description: "Payment already captured"
          }
        });
      }

      // 3️⃣ Capture payment (FINAL STEP)
      const updateResult = await pool.query(
        `
        UPDATE payments
        SET captured = true
        WHERE id = $1
        RETURNING id, status, captured
        `,
        [paymentId]
      );

      return res.status(200).json(updateResult.rows[0]);

    } catch (err) {
      console.error("Capture error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          description: "Failed to capture payment"
        }
      });
    }
  }
);


module.exports = router;
