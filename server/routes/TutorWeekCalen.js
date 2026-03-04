import express from "express";

import { 
    getTutorWeekCalen 
} from "../controllers/TutorWeekCalen.js";

const router = express.Router();

router.get("/TutorWeekCalen", getTutorWeekCalen);

export default router;