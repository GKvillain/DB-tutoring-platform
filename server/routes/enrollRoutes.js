import express from "express";
import { getStudentsByParent, newEnroll,checkAvailability,getParentByEmail } from "../controllers/enrollController.js";
import { uploadFields } from "../middleware/enrollUploadMiddleware.js";

const router = express.Router();

router.post("/newenroll", uploadFields, newEnroll);
router.post("/check-availability", checkAvailability);
router.get("/parent/by-email/:email", getParentByEmail);
router.get("/parent/:parentId/students", getStudentsByParent);
export default router;