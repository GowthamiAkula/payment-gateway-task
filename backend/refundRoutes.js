const express = require("express");
const router = express.Router();
const pool = require("./db");
const authenticateMerchant = require("./authMiddleware");
const redisClient = require("./redis");

router.post("/api/v1/refunds", authenticateMerchant, async (req, res) => {
  const { payment_id, amount } = req.body;

  if (!payment_id || !amount || amount <= 0) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        description: "payment_id and valid amount are required"
      }
    });
  }

  try {
    // 1️⃣ Fetch payment + order amount
    const paymentResult = await pool.query(
      `
      SELECT 
        p.id,
        p.status,
        o.amount
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.id = $1 AND p.merchant_id = $2
      `,
      [payment_id, req.merchant.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          description: "Payment not found"
        }
      });
    }

    const payment = paymentResult.rows[0];

    // 2️⃣ Must be successful
    if (payment.status !== "success") {
      return res.status(400).json({
        error: {
          code: "INVALID_REFUND",
          description: "Only successful payments can be refunded"
        }
      });
    }

    // 3️⃣ Check refunded amount so far
    const refundSumResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS refunded
      FROM refunds
      WHERE payment_id = $1 AND status = 'success'
      `,
      [payment_id]
    );

    const refundedSoFar = Number(refundSumResult.rows[0].refunded);

    if (refundedSoFar + amount > payment.amount) {
      return res.status(400).json({
        error: {
          code: "REFUND_LIMIT_EXCEEDED",
          description: "Refund amount exceeds payment amount"
        }
      });
    }

    // 4️⃣ Create refund (pending)
    const refundResult = await pool.query(
      `
      INSERT INTO refunds (payment_id, amount, status)
      VALUES ($1, $2, 'pending')
      RETURNING id
      `,
      [payment_id, amount]
    );

    const refundId = refundResult.rows[0].id;

    // 5️⃣ Enqueue refund job
    await redisClient.lPush(
      "refund_jobs",
      JSON.stringify({
        type: "PROCESS_REFUND",
        refund_id: refundId
      })
    );

    return res.status(202).json({
      id: refundId,
      payment_id,
      amount,
      status: "pending"
    });

  } catch (err) {
    console.error("Refund API error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to create refund"
      }
    });
  }
});

module.exports = router;
