// client/src/App.jsx
// import { useState, useEffect } from "react";
import Navbar from "./components/Navigation";
import { Route, Routes } from "react-router-dom";
import { StatTutor } from "./pages/StatTutor";
import { PaymentTutor } from "./pages/PaymentTutor";
import { LoginDummy } from "./pages/LoingDummy";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import TutorHome from "./pages/TutorHome";
import { FinanceReport } from "./pages/FinanceReport";
import TutorWeekCalen from "./pages/TutorWeekCalen";
import { LearningRecord } from "./pages/LearningRecord";

function App() {
  return (
    <Routes>
      <Route path="/teaching/statistic" element={<StatTutor />} />
      <Route path="/finance/payment-status" element={<PaymentTutor />} />
      <Route path="/LoginPageDummy" element={<LoginDummy />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/TutorHome" element={<TutorHome />} />
      <Route path="/finance/reports" element={<FinanceReport />} />
      <Route path="/TutorWeekCalen" element={<TutorWeekCalen />} />
      <Route path="/learning/LearningRecord" element={<LearningRecord />} />
    </Routes>
  );
}

export default App;
