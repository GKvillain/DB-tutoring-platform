import express from "express";
import { getCourseSum, getDashboard } from "../controllers/statController.js";

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/getCourseSummary", getCourseSum);

export default router;
