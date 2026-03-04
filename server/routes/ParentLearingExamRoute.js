import express from "express";
import { getExam , getExamResult } from "../controllers/ParentLearningExamController.js";

const router = express.Router();

router.get("/examination", getExam);
router.get("/examinationdetail", getExamResult);

export default router;