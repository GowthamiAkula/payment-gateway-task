const express = require("express");
const router = express.Router();
const authenticateMerchant = require("./authMiddleware");
const redisClient = require("./redis");

/**
 * ================================
 * JOB QUEUE STATUS
 * GET /api/v1/jobs/status
 * ================================
 */
router.get(
  "/api/v1/jobs/status",
  authenticateMerchant,
  async (req, res) => {
    try {
      const paymentJobs = await redisClient.lLen("payment_jobs");
      const refundJobs = await redisClient.lLen("refund_jobs");

      return res.json({
        redis: "connected",
        queues: {
          payment_jobs: { pending: paymentJobs },
          refund_jobs: { pending: refundJobs }
        }
      });
    } catch (err) {
      console.error("Job status error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          description: "Failed to fetch job queue status"
        }
      });
    }
  }
);
/**
 * ================================
 * JOB RETRY STATS
 * GET /api/v1/jobs/retries
 * ================================
 */
router.get(
  "/api/v1/jobs/retries",
  authenticateMerchant,
  async (req, res) => {
    try {
      const retries = await redisClient.get("job_retry_count");

      return res.json({
        retry_count: Number(retries || 0)
      });
    } catch (err) {
      console.error("Retry stats error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          description: "Failed to fetch retry stats"
        }
      });
    }
  }
);

/**
 * ================================
 * RESET JOB QUEUES
 * POST /api/v1/jobs/reset
 * ================================
 */
router.post(
  "/api/v1/jobs/reset",
  authenticateMerchant,
  async (req, res) => {
    try {
      await redisClient.del("payment_jobs");
      await redisClient.del("refund_jobs");
      await redisClient.del("job_retry_count");

      return res.json({
        message: "Job queues and retry stats reset successfully"
      });
    } catch (err) {
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          description: "Failed to reset job queues"
        }
      });
    }
  }
);

module.exports = router;
