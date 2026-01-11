const pool = require("./db");

async function authenticateMerchant(req, res, next) {
  const apiKey = req.header("X-Api-Key");
  const apiSecret = req.header("X-Api-Secret");

  // Check headers exist
  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_ERROR",
        description: "Missing API key or secret"
      }
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, is_active 
       FROM merchants 
       WHERE api_key = $1 AND api_secret = $2`,
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_ERROR",
          description: "Invalid API credentials"
        }
      });
    }

    const merchant = result.rows[0];

    if (!merchant.is_active) {
      return res.status(403).json({
        error: {
          code: "AUTHENTICATION_ERROR",
          description: "Merchant is inactive"
        }
      });
    }

    // Attach merchant to request
    req.merchant = merchant;
    next();
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Authentication failed"
      }
    });
  }
}

module.exports = authenticateMerchant;
