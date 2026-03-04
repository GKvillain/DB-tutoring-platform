import express from "express";
import { getTutorProfile, updateTutorProfile } from "../controllers/tutorProfileController.js";
import { uploadFields } from "../middleware/enrollUploadMiddleware.js";

const router = express.Router();

router.get("/tutor/profile/:account_id", getTutorProfile);
router.put("/tutor/profile/:account_id", uploadFields, updateTutorProfile);

export default router;