require("dotenv").config();

const redisClient = require("./redis");
const pool = require("./db");
const crypto = require("crypto");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log("🚀 Worker service started");

// ================================
// Retry schedules
// ================================
const TEST_RETRIES = [0, 5000, 10000, 20000, 40000];
const PROD_RETRIES = [0, 30000, 120000, 600000, 1800000];

function getRetryDelays() {
  return process.env.TEST_MODE === "true"
    ? TEST_RETRIES
    : PROD_RETRIES;
}

// ================================
// PAYMENT WEBHOOK
// ================================
async function sendWebhookWithRetry(paymentId, status) {
  const result = await pool.query(
    `
    SELECT m.id AS merchant_id, m.webhook_url, m.webhook_secret
    FROM payments p
    JOIN merchants m ON m.id = p.merchant_id
    WHERE p.id = $1
    `,
    [paymentId]
  );

  if (result.rows.length === 0) return;

  const { merchant_id, webhook_url, webhook_secret } = result.rows[0];
  if (!webhook_url || !webhook_secret) return;

  const payload = {
    event: `payment.${status}`,
    data: { payment: { id: paymentId, status } },
    created_at: Math.floor(Date.now() / 1000)
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", webhook_secret)
    .update(payloadString)
    .digest("hex");

  const retryDelays = getRetryDelays();

  for (let attempt = 1; attempt <= 5; attempt++) {
    if (attempt > 1) await delay(retryDelays[attempt - 1]);

    let responseCode = null;
    let deliveryStatus = "failed";
    let shouldRetry = false;

    try {
      const response = await fetch(webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature
        },
        body: payloadString
      });

      responseCode = response.status;

      if (response.ok) deliveryStatus = "success";
      else if (response.status >= 500) shouldRetry = true;

    } catch {
      shouldRetry = true;
    }

    await pool.query(
      `
      INSERT INTO webhook_logs (
        merchant_id, event_type, webhook_url,
        attempt, status, response_code, next_retry_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        merchant_id,
        payload.event,
        webhook_url,
        attempt,
        deliveryStatus,
        responseCode,
        attempt < 5 ? new Date(Date.now() + retryDelays[attempt]) : null
      ]
    );

    if (!shouldRetry || deliveryStatus === "success") break;
  }
}

// ================================
// REFUND WEBHOOK
// ================================
async function sendRefundWebhook(refundId, status) {
  const result = await pool.query(
    `
    SELECT r.id, r.amount, r.payment_id,
           p.merchant_id, m.webhook_url, m.webhook_secret
    FROM refunds r
    JOIN payments p ON p.id = r.payment_id
    JOIN merchants m ON m.id = p.merchant_id
    WHERE r.id = $1
    `,
    [refundId]
  );

  if (result.rows.length === 0) return;

  const refund = result.rows[0];
  if (!refund.webhook_url || !refund.webhook_secret) return;

  const payload = {
    event: `refund.${status}`,
    data: {
      refund: {
        id: refund.id,
        payment_id: refund.payment_id,
        amount: refund.amount,
        status
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", refund.webhook_secret)
    .update(payloadString)
    .digest("hex");

  try {
    await fetch(refund.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature
      },
      body: payloadString
    });

    await pool.query(
      `
      INSERT INTO webhook_logs
      (merchant_id, event_type, webhook_url, attempt, status)
      VALUES ($1,$2,$3,1,'success')
      `,
      [refund.merchant_id, payload.event, refund.webhook_url]
    );
  } catch {
    await pool.query(
      `
      INSERT INTO webhook_logs
      (merchant_id, event_type, webhook_url, attempt, status)
      VALUES ($1,$2,$3,1,'failed')
      `,
      [refund.merchant_id, payload.event, refund.webhook_url]
    );
  }
}

// ================================
// PROCESS PAYMENT JOB
// ================================
async function processPaymentJob(job) {
  const { payment_id } = job;

  await redisClient.incr("payment_jobs:processing");

  try {
    await delay(Number(process.env.TEST_PROCESSING_DELAY || 3000));

    const success =
      process.env.TEST_MODE === "true"
        ? process.env.TEST_PAYMENT_SUCCESS === "true"
        : Math.random() > 0.3;

    const finalStatus = success ? "success" : "failed";

    await pool.query(
      `UPDATE payments SET status = $1 WHERE id = $2`,
      [finalStatus, payment_id]
    );

    await sendWebhookWithRetry(payment_id, finalStatus);

  } catch (err) {
    await redisClient.incr("payment_jobs:failed");
    console.error("❌ Payment job failed:", err);
  } finally {
    await redisClient.decr("payment_jobs:processing");
  }
}

// ================================
// PROCESS REFUND JOB
// ================================
async function processRefundJob(job) {
  const { refund_id } = job;

  await redisClient.incr("refund_jobs:processing");

  try {
    await delay(Number(process.env.TEST_PROCESSING_DELAY || 3000));

    await pool.query(
      `UPDATE refunds SET status = 'success' WHERE id = $1`,
      [refund_id]
    );

    await sendRefundWebhook(refund_id, "success");

  } catch (err) {
    await redisClient.incr("refund_jobs:failed");
    console.error("❌ Refund job failed:", err);
  } finally {
    await redisClient.decr("refund_jobs:processing");
  }
}

// ================================
// WORKER LOOP
// ================================
async function startWorker() {
  while (true) {
    try {
      const result = await redisClient.brPop(
        ["payment_jobs", "refund_jobs"],
        0
      );

      const jobData = JSON.parse(result.element);

      if (jobData.type === "PROCESS_PAYMENT") {
        await processPaymentJob(jobData);
      }

      if (jobData.type === "PROCESS_REFUND") {
        await processRefundJob(jobData);
      }

    } catch (err) {
      console.error("❌ Worker loop error:", err);
      await redisClient.incr("job_retry_count");
      await delay(2000);
    }
  }
}

startWorker();
