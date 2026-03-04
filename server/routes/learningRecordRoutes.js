import express from "express";
import {
  getSummaryLearning,
  getSummaryLearningDetail,
} from "../controllers/learningRecord.js";

const router = express.Router();

router.get("/learningSummary", getSummaryLearning);
router.get("/learningDetail", getSummaryLearningDetail); // Add this line

export default router;
