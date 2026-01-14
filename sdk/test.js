// sdk/test.js
const Client = require("./client");

(async () => {
  try {
    const pg = new Client({
      key: "key_test_abc123",
      secret: "secret_test_xyz789",
      baseUrl: "http://localhost:8000"
    });

    console.log("✅ SDK initialized");

    const order = await pg.createOrder(50000);
    console.log("🧾 Order created:", order);

    const payment = await pg.createPayment({
      order_id: order.id,
      method: "upi",
      vpa: "test@upi"
    });
    console.log("💳 Payment created:", payment);

    console.log("🎉 SDK test completed successfully");
  } catch (err) {
    console.error("❌ SDK test failed:", err.message);
  }
})();
