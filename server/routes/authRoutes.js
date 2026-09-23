import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import rateLimit from "express-rate-limit";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please wait before trying again." },
});

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").optional({ values: "falsy" }).isEmail().withMessage("Valid email is required when provided"),
    body("phone").optional({ values: "falsy" }).isString().withMessage("Valid phone is required when provided"),
    body("password").isLength({ min: 10 }).withMessage("Password must be at least 10 characters"),
  ],
  validate,
  registerUser
);

router.post(
  "/login",
  authLimiter,
  [
    body("identifier").optional({ values: "falsy" }).isString().withMessage("Email or phone is required"),
    body("email").optional({ values: "falsy" }).isEmail().withMessage("Valid email is required when using email login"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  loginUser
);

router.post(
  "/google",
  authLimiter,
  [body("credential").isString().isLength({ min: 20, max: 6000 }).withMessage("Valid Google credential is required")],
  validate,
  googleLogin
);

router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
