module.exports = (client) => ({
  logs: () =>
    client.request("GET", "/api/v1/webhooks/logs"),

  retry: (logId) =>
    client.request("POST", `/api/v1/webhooks/${logId}/retry`)
});
