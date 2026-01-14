// sdk/client.js

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class PaymentGatewayClient {
  constructor({ key, secret, baseUrl = "http://localhost:8000" }) {
    if (!key || !secret) {
      throw new Error("API key and secret are required");
    }

    this.key = key;
    this.secret = secret;
    this.baseUrl = baseUrl;
  }

  // ================================
  // INTERNAL REQUEST HANDLER
  // ================================
  async request(method, path, body = null) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.key,
        "X-Api-Secret": this.secret
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.description || "API request failed"
      );
    }

    return data;
  }

  // ================================
  // ORDERS
  // ================================
  createOrder(amount) {
    return this.request("POST", "/api/v1/orders", { amount });
  }

  // ================================
  // PAYMENTS
  // ================================
  createPayment({ order_id, method, vpa, card }) {
    return this.request("POST", "/api/v1/payments", {
      order_id,
      method,
      vpa,
      card
    });
  }

  listPayments() {
    return this.request("GET", "/api/v1/payments");
  }

  capturePayment(paymentId) {
    return this.request(
      "POST",
      `/api/v1/payments/${paymentId}/capture`
    );
  }

  // ================================
  // REFUNDS
  // ================================
  createRefund(payment_id, amount) {
    return this.request("POST", "/api/v1/refunds", {
      payment_id,
      amount
    });
  }

  listRefunds() {
    return this.request("GET", "/api/v1/refunds");
  }

  // ================================
  // WEBHOOKS
  // ================================
  configureWebhook(webhook_url) {
    return this.request("POST", "/api/v1/webhooks/config", {
      webhook_url
    });
  }

  getWebhookLogs() {
    return this.request("GET", "/api/v1/webhooks/logs");
  }

  retryWebhook(logId) {
    return this.request(
      "POST",
      `/api/v1/webhooks/${logId}/retry`
    );
  }

  // ================================
  // JOB QUEUES
  // ================================
  getJobStatus() {
    return this.request("GET", "/api/v1/jobs/status");
  }

  getRetryStats() {
    return this.request("GET", "/api/v1/jobs/retries");
  }

  resetJobs() {
    return this.request("POST", "/api/v1/jobs/reset");
  }
}

module.exports = PaymentGatewayClient;
