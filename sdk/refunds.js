module.exports = (client) => ({
  create: (paymentId, amount) =>
    client.request("POST", "/api/v1/refunds", {
      payment_id: paymentId,
      amount
    })
});
