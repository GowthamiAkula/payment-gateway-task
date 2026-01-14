const APIClient = require("./client");

class PaymentGateway {
  constructor(config) {
    this.client = new APIClient(config);

    this.orders = require("./orders")(this.client);
    this.payments = require("./payments")(this.client);
    this.refunds = require("./refunds")(this.client);
    this.webhooks = require("./webhooks")(this.client);
  }
}

module.exports = PaymentGateway;
