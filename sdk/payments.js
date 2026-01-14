module.exports = (client) => ({
  create: (data) =>
    client.request("POST", "/api/v1/payments", data),

  capture: (paymentId) =>
    client.request("POST", `/api/v1/payments/${paymentId}/capture`)
});
