import express from "express";
import { getSubjects, addSubject } from "../controllers/subjectController.js";

const router = express.Router();

router.get("/subjects", getSubjects);
router.post("/subjects", addSubject);

export default router;