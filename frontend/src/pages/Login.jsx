import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!apiKey || !apiSecret) {
      alert("Please enter API Key and API Secret");
      return;
    }

    // Save credentials (temporary)
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("apiSecret", apiSecret);

    navigate("/dashboard");
  };

  return (
    <div>
      <h2>Merchant Login</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>API Key</label><br />
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: "300px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>API Secret</label><br />
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            style={{ width: "300px" }}
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
