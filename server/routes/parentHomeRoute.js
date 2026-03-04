import express from "express";
import { getParentHomeData } from "../controllers/parentHomeController.js";

const router = express.Router();

router.get("/classsessions", getParentHomeData);

export default router;