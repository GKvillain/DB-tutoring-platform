// client/src/App.jsx
// import { useState, useEffect } from "react";
import Navbar from "./components/Navigation";
import { Route, Routes } from "react-router-dom";
import { StatTutor } from "./pages/StatTutor";
import { PaymentTutor } from "./pages/PaymentTutor";
import { Summary } from "./pages/Summary";

function App() {
  return (
    <Routes>
      <Route path="teaching/statistics" element={<StatTutor />} />
      <Route path="payment/statuspayment" element={<PaymentTutor />} />
      <Route path="student/summary" element={<Summary />} />
    </Routes>
  );
}

export default App;
