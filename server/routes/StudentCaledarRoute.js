import express from "express";
import { getStudentCalendar,getParentProfile } from "../controllers/StudentCaledarController.js";

const router = express.Router();

router.get("/student/schedule", getStudentCalendar);
router.get("/parent/profile", getParentProfile);
export default router;