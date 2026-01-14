const API_URL = "http://localhost:8000/api/v1/payments";

async function loadPayments() {
  const res = await fetch(API_URL, {
    headers: {
      "X-Api-Key": "key_test_abc123",
      "X-Api-Secret": "secret_test_xyz789"
    }
  });

  const payments = await res.json();
  const tbody = document.querySelector("#paymentsTable tbody");

  tbody.innerHTML = "";

  payments.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.order_id}</td>
      <td>₹${p.amount}</td>
      <td class="${p.status}">${p.status}</td>
      <td>${p.captured ? "✅ Yes" : "❌ No"}</td>
      <td>${new Date(p.created_at).toLocaleString()}</td>
    `;

    tbody.appendChild(tr);
  });
}

loadPayments();
