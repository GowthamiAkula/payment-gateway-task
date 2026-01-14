import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Webhooks from "./pages/Webhooks";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/transactions" element={<Transactions />} />
        <Route path="/dashboard/webhooks" element={<Webhooks />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
