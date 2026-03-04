import express from "express";
import { updateEnrollmentStatus } from "../controllers/courseStudentController.js";

const router = express.Router();

router.put("/enrollment/:enrollmentId/status", updateEnrollmentStatus);

export default router;