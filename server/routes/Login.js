import express from "express";

import {
    getLogin
}from "../controllers/Login.js";

const router = express.Router();

router.post("/Login",getLogin);

export default router;