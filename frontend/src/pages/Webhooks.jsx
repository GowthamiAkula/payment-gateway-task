import { useEffect, useState } from "react";
import "./Webhooks.css";

function Webhooks() {
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  const apiKey = localStorage.getItem("apiKey");
  const apiSecret = localStorage.getItem("apiSecret");

  // Load logs
  const loadLogs = () => {
    fetch("/api/v1/webhooks/logs", {
      headers: {
        "X-Api-Key": apiKey,
        "X-Api-Secret": apiSecret,
      },
    })
      .then(res => res.json())
      .then(setLogs);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Configure webhook
  const saveWebhook = () => {
    fetch("/api/v1/webhooks/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "X-Api-Secret": apiSecret,
      },
      body: JSON.stringify({ webhook_url: url }),
    })
      .then(res => res.json())
      .then(data => {
        setSecret(data.webhook_secret);
        setMessage("Webhook configured successfully");
        loadLogs();
      });
  };

  // Retry webhook
  const retryWebhook = (id) => {
    fetch(`/api/v1/webhooks/${id}/retry`, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "X-Api-Secret": apiSecret,
      },
    }).then(() => loadLogs());
  };

  return (
    <div className="webhooks-container">
      <h2>Webhook Settings</h2>

      <div className="card">
        <input
          placeholder="Webhook URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={saveWebhook}>Save Webhook</button>

        {secret && (
          <p><b>Webhook Secret:</b> {secret}</p>
        )}
        {message && <p className="ok">{message}</p>}
      </div>

      <h3>Webhook Logs</h3>

      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Status</th>
            <th>Attempt</th>
            <th>Response</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.event_type}</td>
              <td>{log.status}</td>
              <td>{log.attempt}</td>
              <td>{log.response_code}</td>
              <td>
                {log.status === "failed" && (
                  <button onClick={() => retryWebhook(log.id)}>
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Webhooks;
