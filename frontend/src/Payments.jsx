import { useEffect, useState } from "react";

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/payments", {
      headers: {
        "X-Api-Key": "key_test_abc123",
        "X-Api-Secret": "secret_test_xyz789"
      }
    })
      .then(res => res.json())
      .then(data => setPayments(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Payments</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Order ID</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Captured</th>
          </tr>
        </thead>

        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.order_id}</td>
              <td>₹{p.amount}</td>
              <td>{p.method}</td>
              <td>{p.status}</td>
              <td>{p.captured ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
