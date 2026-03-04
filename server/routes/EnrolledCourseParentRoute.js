import express from "express";
import { getStudentParent, getEnrolledCoursesParent } from "../controllers/EnrolledCourseParentController.js";

const router = express.Router();

router.get("/students", getStudentParent);
router.get("/enrollments", getEnrolledCoursesParent);


export default router;