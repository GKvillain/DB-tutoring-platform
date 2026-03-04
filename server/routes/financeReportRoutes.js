import express from "express";
import {
  getIncomeFinance,
  getDetailPayment,
} from "../controllers/FinanceReportController.js";

const router = express.Router();

router.get("/statistics/:tutorId", getIncomeFinance);

export default router;
