import express from "express";
import rateLimit from "express-rate-limit";
import { askConcierge, getCoverage, getDirectory, getLocations } from "../controllers/careNavigatorController.js";

const router = express.Router();
const conciergeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many concierge requests. Please try again shortly." },
});

router.get("/directory", getDirectory);
router.get("/locations", getLocations);
router.get("/coverage", getCoverage);
router.post("/ask", conciergeLimiter, askConcierge);

export default router;
