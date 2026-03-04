import express from "express";
import { getCourseDetailParent } from "../controllers/CourseDetailParentController.js";

const router = express.Router();

router.get("/course/:courseId/detail", getCourseDetailParent);

export default router;