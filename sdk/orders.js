module.exports = (client) => ({
  create: (amount) =>
    client.request("POST", "/api/v1/orders", { amount })
});
