import express from "express";
import multer from "multer";
import { 
  getStudentPaymentHistory, 
  getStudentCourses,
  getPendingPayments,
  getBankInfo,
  createPaymentWithSlip,  // เปลี่ยนชื่อ import
  uploadPaymentSlip
} from "../controllers/parentPaymentController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get("/payment-history", getStudentPaymentHistory);
router.get("/student-courses", getStudentCourses);
router.get("/pending-payments", getPendingPayments);
router.get("/bank-info", getBankInfo);
router.post("/create-payment", createPaymentWithSlip); // ใช้ฟังก์ชันใหม่แทน
router.post("/upload-slip", upload.single('slip'), uploadPaymentSlip);

export default router;