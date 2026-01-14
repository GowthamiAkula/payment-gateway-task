import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const apiKey = localStorage.getItem("apiKey");
  const apiSecret = localStorage.getItem("apiSecret");

  const [health, setHealth] = useState({
    backend: "Checking...",
    database: "Checking..."
  });

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch("/health");
        const data = await res.json();

        setHealth({
          backend: data.status === "ok" ? "Operational" : "Down",
          database: data.database || "Unknown"
        });
      } catch (err) {
        setHealth({
          backend: "Not Reachable",
          database: "Not Reachable"
        });
      }
    }

    loadHealth();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Merchant Dashboard</h1>

      <div className="card">
        <h3>API Credentials</h3>

        <div className="key-row">
          <span>API Key</span>
          <code>{apiKey}</code>
        </div>

        <div className="key-row">
          <span>API Secret</span>
          <code>{apiSecret}</code>
        </div>
      </div>

      <div className="grid">
        <div className="stat-card">
          <h4>Backend Status</h4>
          <p className={health.backend === "Operational" ? "ok" : "error"}>
            {health.backend}
          </p>
        </div>

        <div className="stat-card">
          <h4>Database</h4>
          <p>{health.database}</p>
        </div>
      </div>

      <div className="actions">
        <Link to="/dashboard/transactions" className="btn">
          View Transactions
        </Link>

        <Link to="/dashboard/webhooks" className="btn">
          Webhook Settings
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
