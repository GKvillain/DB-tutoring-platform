// server/routes/learningRecordRoutes.js
import express from "express";
import {
  getSummaryLearning,
  getSummaryLearningDetail,
  updateLearningDetail,
  addLearningRecord,
} from "../controllers/learningRecord.js";

const router = express.Router();

// Define routes
router.get("/learningSummary", getSummaryLearning);
router.get("/learningDetail", getSummaryLearningDetail);
router.put("/updateLearningDetail", updateLearningDetail);
router.post("/addLearningRecord", addLearningRecord);

export default router;
