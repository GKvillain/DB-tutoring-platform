import express from "express";
import {
  getSummaryLearning,
  getSummaryLearningDetail,
  updateLearningDetail,
  addLearningRecord,
  getSummaryExam,
  getExamDetail,
} from "../controllers/learningRecord.js";

const router = express.Router();

// Define routes
router.get("/learningSummary", getSummaryLearning);
router.get("/learningDetail", getSummaryLearningDetail);
router.put("/updateLearningDetail", updateLearningDetail);
router.post("/addLearningRecord", addLearningRecord);
router.get("/examSummary", getSummaryExam); // Changed from POST to GET
router.get("/examDetail", getExamDetail);

export default router;
