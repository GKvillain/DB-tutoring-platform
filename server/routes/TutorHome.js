import express from "express";

import {
    getTutorHome,
    getUpdateNote
}from "../controllers/TutorHome.js";

const router=express.Router();

router.post("/TutorHome",getTutorHome);

export default router;