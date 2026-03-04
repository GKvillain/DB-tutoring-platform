import express from "express";
import { getGradeLevels, addGradeLevel } from "../controllers/gradeLevelController.js";

const router = express.Router();

router.get("/grade-levels", getGradeLevels);
router.post("/grade-levels", addGradeLevel);

export default router;