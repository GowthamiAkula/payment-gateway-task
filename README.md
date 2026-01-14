# Payment Gateway Simulation System

## 📌 Project Overview

This project is a full-stack **Payment Gateway Simulation System** inspired by real-world platforms like Razorpay and Stripe. It allows merchants to create orders, accept payments via UPI or Card, and simulate payment success or failure in a secure, test-friendly environment.

The project demonstrates backend API design, authentication, database integration, frontend checkout flows, and containerized deployment using Docker.

---

## 🏗️ System Architecture

The system follows a **three-layer architecture**:

### 1️⃣ Backend (Node.js + Express)
- Handles merchant authentication using API Key and API Secret
- Provides REST APIs for:
  - Order creation
  - Payment processing
  - Order and payment retrieval
- Supports **test mode** to simulate payment success or failure
- Connects to PostgreSQL for persistent storage

### 2️⃣ Database (PostgreSQL)
- Stores merchants, orders, and payments
- Maintains transactional integrity
- Stores card metadata such as last 4 digits and card network

### 3️⃣ Frontend
- **Merchant Dashboard**
  - Displays API key
  - Shows backend and database health status
- **Checkout Page**
  - Simulates customer payment via UPI or Card
  - Redirects to success or failure page based on payment outcome

### 4️⃣ Containerization
- Backend, database, merchant frontend, and checkout page are containerized
- Docker Compose is used to orchestrate services for consistent execution

---

## 🧰 Technology Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Frontend:** React (Vite)
- **Web Server:** Nginx
- **Containerization:** Docker, Docker Compose

---

## 🔌 API Documentation

## 🔐 Test API Credentials

For evaluation and testing purposes, the following test credentials are pre-configured in the database:

API Key: key_test_abc123  
API Secret: secret_test_xyz789

### 🔹 Health Check
```

GET /health

````

Response:
```json
{
  "status": "ok",
  "database": "connected"
}
````

---

### 🔹 Create Order

```
POST /api/v1/orders
```

Headers:

```
X-Api-Key
X-Api-Secret
```

Body:

```json
{
  "amount": 50000
}
```

Response:

```json
{
  "id": "order_xxx",
  "amount": 50000,
  "currency": "INR",
  "status": "created"
}
```

---

### 🔹 List Orders

```
GET /api/v1/orders
```

Headers:

```
X-Api-Key
X-Api-Secret
```

---

### 🔹 Create Payment

```
POST /api/v1/payments
```

Headers:

```
X-Api-Key
X-Api-Secret
```

#### UPI Example

```json
{
  "order_id": "order_xxx",
  "method": "upi",
  "vpa": "test@upi"
}
```

#### Card Example

```json
{
  "order_id": "order_xxx",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry": "12/30",
    "cvv": "123"
  }
}
```

Response:

```json
{
  "id": "pay_xxx",
  "order_id": "order_xxx",
  "status": "success",
  "amount": 50000,
  "currency": "INR",
  "method": "upi"
}
```

---

## ▶️ How to Run the Project

### Prerequisites

* Docker
* Docker Compose

### Steps

```bash
docker compose up --build
```

### Access URLs

* **Backend API:** [http://localhost:8000](http://localhost:8000)
* **Merchant Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Checkout Page (Dev):** [http://localhost:5173](http://localhost:5173)

---

## 🧪 Test Mode Configuration

The backend supports test mode using environment variables:

```
TEST_MODE=true
TEST_PAYMENT_SUCCESS=true | false
TEST_PROCESSING_DELAY=2000
```

* When `TEST_PAYMENT_SUCCESS=true`, all payments succeed
* When `false`, payments fail (useful for testing failure flows)

---

## ⚠️ Known Limitations

* The Transactions page UI is implemented, but in Docker production mode the frontend runs behind Nginx and does not proxy `/api` routes to the backend container.
* Backend APIs for listing orders and payments are fully functional and verified using curl/Postman.
* This limitation does not affect the core payment gateway functionality.

---

## ✅ Conclusion

This project successfully demonstrates a real-world payment gateway workflow including merchant authentication, order management, payment processing, database persistence, frontend checkout simulation, and containerized deployment.

# 💳 Payment Gateway System (End-to-End)

A fully functional **Payment Gateway System** built using **Node.js, PostgreSQL, Redis, Docker, and React**.  
This project simulates real-world payment gateway behavior including **orders, payments, refunds, webhooks, job queues, retries, and a merchant dashboard UI**.

---

## 🚀 Project Overview

This system allows merchants to:

- Create orders
- Accept payments (UPI / Card)
- Capture payments
- Process refunds asynchronously
- Receive webhook notifications
- View transactions and system health via a dashboard
- Track background jobs and retries

The project is designed to be **Docker-only runnable**, evaluator-friendly, and production-inspired.

---

## 🧱 Tech Stack

### Backend
- **Node.js (Express)**
- **PostgreSQL** – primary database
- **Redis** – job queues & retry counters
- **Worker service** – async processing
- **Crypto (HMAC SHA256)** – webhook signature verification

### Frontend
- **React (Vite)**
- **React Router**
- **CSS (custom dashboard styling)**
- **Nginx** – frontend + API proxy

### DevOps
- **Docker & Docker Compose**
- Multi-container architecture

---

## 🧩 Architecture

```

Frontend (React + Nginx)
|
|  /api/*
v
Backend API (Node.js / Express)
|
|-- PostgreSQL (orders, payments, refunds, merchants)
|
|-- Redis (payment_jobs, refund_jobs, retry counters)
|
|-- Worker Service (async jobs + webhooks)

````

---

## 🔐 Authentication

All merchant APIs are protected using:
- `X-Api-Key`
- `X-Api-Secret`

These credentials are stored securely in the database and validated via middleware.

---

## 📦 Core Features

### 1️⃣ Orders
- Create orders with amount & currency
- Status lifecycle: `created → paid`

### 2️⃣ Payments (Async)
- Supports **UPI** and **Card**
- Payment is created as `pending`
- Worker processes payment asynchronously
- Final status: `success` or `failed`

### 3️⃣ Capture Payment
- Only `success` payments can be captured
- Prevents double capture

### 4️⃣ Refunds (Async)
- Refunds processed via worker queue
- Refund webhook triggered after success

### 5️⃣ Webhooks
- Merchant-configurable webhook URL
- Secure **HMAC SHA256 signature**
- Supports retries with exponential backoff
- All attempts logged in `webhook_logs`

### 6️⃣ Job Queue System
- Redis-backed queues:
  - `payment_jobs`
  - `refund_jobs`
- Job status & retry stats APIs
- Reset queues endpoint

### 7️⃣ Dashboard (React)
- Merchant login using API credentials
- System health (backend + database)
- Transactions table (live from backend)
- Webhook configuration UI
- Clean and responsive layout

---

## 🖥️ Dashboard Pages

- `/` → Login
- `/dashboard` → Merchant dashboard
- `/dashboard/transactions` → Payments table
- `/dashboard/webhooks` → Webhook settings (URL + secret)

---

## 🔔 Webhook Events

### Payment
- `payment.success`
- `payment.failed`

### Refund
- `refund.success`

Each webhook includes:
- Event type
- Resource data
- Timestamp
- `X-Webhook-Signature` header

---

## 🧪 Testing & Verification

### Manual API Tests (curl)

```bash
# Create Order
curl -X POST http://localhost:8000/api/v1/orders \
 -H "X-Api-Key: key_test_abc123" \
 -H "X-Api-Secret: secret_test_xyz789" \
 -d '{"amount":50000}'
````

```bash
# Create Payment
curl -X POST http://localhost:8000/api/v1/payments \
 -H "X-Api-Key: key_test_abc123" \
 -H "X-Api-Secret: secret_test_xyz789" \
 -d '{"order_id":"ORDER_ID","method":"upi","vpa":"test@upi"}'
```

```bash
# List Payments
curl http://localhost:8000/api/v1/payments \
 -H "X-Api-Key: key_test_abc123" \
 -H "X-Api-Secret: secret_test_xyz789"
```

---

### Test Merchant Webhook

```bash
node test-merchant/webhook-receiver.js
```

Verifies:

* Signature validation
* Payload correctness
* Retry handling

---

## 🐳 Docker Setup (Evaluator Ready)

### Run entire system

```bash
docker compose up -d
```

Services started:

* PostgreSQL
* Redis
* Backend API
* Worker
* Merchant Dashboard
* Checkout App

No local setup required beyond Docker.

---
