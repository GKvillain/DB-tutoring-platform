// client/src/App.jsx
// import { useState, useEffect } from "react";
import Navbar from "./components/Navigation";
import { Route, Routes } from "react-router-dom";
import { StatTutor } from "./pages/StatTutor";
import { PaymentTutor } from "./pages/PaymentTutor";
import { Summary } from "./pages/Summary";
// import { Login } from "./pages/LoingDummy";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import TutorHome from "./pages/TutorHome";

function App() {
  return (
    <Routes>
      <Route path="/teaching/statistic" element={<StatTutor />} />
      <Route path="/finance/payment-status" element={<PaymentTutor />} />
      <Route path="student/summary" element={<Summary />} />
      {/* <Route path="LoginPage" element={<Login />} /> */}
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/TutorHome" element={<TutorHome />} />
    </Routes>
  );
}

export default App;
