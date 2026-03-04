import express from "express";
import { editInfoParent,getParentInfo } from "../controllers/EditInfoParentController.js";

const router = express.Router();

router.put("/EditInfoParent", editInfoParent);
router.get("/EditInfoParent", getParentInfo); 
export default router;