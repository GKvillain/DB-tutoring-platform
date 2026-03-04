import express from "express";
import multer from "multer";
import { getStudentInfo, editStudentInfo, uploadStudentImage } from "../controllers/EditStudentInfo.js";

// ตั้งค่า multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const router = express.Router();

router.get("/:studentId/info", getStudentInfo);
router.put("/update", editStudentInfo);
// เพิ่ม multer middleware ใน route
router.post("/upload-image", upload.single('image'), uploadStudentImage);

export default router;