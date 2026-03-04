import express from "express";
import { 
  getCourses, 
  getAllCourses, 
  addCourse,
  getCourseById,
  getTutorCourses,
  getCourseDetail,
  getCourseForEdit, 
  updateCourse,
  checkCourseCanDelete,  
  deleteCourse        
} from "../controllers/courseController.js";
import { uploadSingle } from "../middleware/enrollUploadMiddleware.js";

const router = express.Router();

router.get("/courses", getCourses);
router.get("/allCourses", getAllCourses);
router.post("/tutor/addCourse", uploadSingle, addCourse);
router.get("/tutor/courses", getTutorCourses);
router.get("/course/:courseId", getCourseById);
router.get("/course/:courseId/detail", getCourseDetail);
router.get("/course/:courseId/edit", getCourseForEdit);           // เพิ่ม
router.put("/course/:courseId", uploadSingle, updateCourse); 
//delete course
router.get("/course/:courseId/check-delete", checkCourseCanDelete);
router.delete("/course/:courseId", deleteCourse);


export default router;