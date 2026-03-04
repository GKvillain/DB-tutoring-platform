import express from "express";
import {
  getIncomeFinance,
  getDetailPayment,
} from "../controllers/FinanceReportController.js";

const router = express.Router();

// Change these to match frontend calls
router.get("/income-finance/statistics/:tutorId", getIncomeFinance);
router.get("/getDetailPayment/:current_tutor_id", getDetailPayment);

export default router;
