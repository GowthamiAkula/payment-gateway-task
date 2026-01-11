import { useEffect, useState } from "react";

function Transactions() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const apiKey = localStorage.getItem("apiKey");
    const apiSecret = localStorage.getItem("apiSecret");

    fetch("/api/v1/payments", {
      headers: {
        "X-Api-Key": apiKey,
        "X-Api-Secret": apiSecret,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch transactions");
        }
        return res.json();
      })
      .then((data) => {
        setPayments(data);
      })
      .catch(() => {
        setError("Unable to load transactions");
      });
  }, []);

  return (
    <div>
      <h2>Transactions</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {payments.length === 0 ? (
        <p>No transactions found</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.order_id}</td>
                <td>₹{payment.amount / 100}</td>
                <td>{payment.status}</td>
                <td>{payment.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transactions;
