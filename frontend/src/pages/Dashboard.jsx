import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const apiKey = localStorage.getItem("apiKey");
  const apiSecret = localStorage.getItem("apiSecret");

  const [health, setHealth] = useState({
    backend: "Checking...",
    database: ""
  });

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then(res => res.json())
      .then(data => {
        setHealth({
          backend: data.status === "ok" ? "Operational" : "Down",
          database: data.database
        });
      })
      .catch(() => {
        setHealth({
          backend: "Not Reachable",
          database: ""
        });
      });
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Merchant Dashboard</h1>

      {/* Credentials */}
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

      {/* Health Cards */}
      <div className="grid">
        <div className="stat-card">
          <h4>Backend Status</h4>
          <p
            className={
              health.backend === "Operational" ? "ok" : "error"
            }
          >
            {health.backend}
          </p>
        </div>

        <div className="stat-card">
          <h4>Database</h4>
          <p>{health.database || "Unknown"}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="actions">
        <a href="/dashboard/transactions" className="btn">
          View Transactions
        </a>
      </div>
    </div>
  );
}

export default Dashboard;
