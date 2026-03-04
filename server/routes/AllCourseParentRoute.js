import express from "express";
import { getAllCourseParent,getAllCourseTutor } from "../controllers/AllCourseParentControllers.js";

const router = express.Router();
router.get("/allCourses", getAllCourseParent);
router.get("/tutor/allCourses", getAllCourseTutor);


export default router;