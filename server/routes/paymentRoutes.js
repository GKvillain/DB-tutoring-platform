import express from "express";
import {
  getHoursPending,
  getDetailPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/getHoursPending", getHoursPending);
router.get("/getDetailPayment/:tutor_id", getDetailPayment); // Add this line

export default router;
