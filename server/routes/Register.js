import express from "express";

import {
    getRegister
}from "../controllers/Register.js";

const router = express.Router();

router.post("/Regiter",getRegister);

export default router;