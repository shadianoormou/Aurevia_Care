import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  loginUser
);

router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
