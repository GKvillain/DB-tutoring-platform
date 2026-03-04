import express from "express";
import { getTutorProfileParent } from "../controllers/TutorProfileParentController.js";

const router = express.Router();

router.get("/tutor/:tutorId/profile", getTutorProfileParent);

export default router;