import express from "express";
import { addReview, getProductReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/:productId", protect, addReview);
router.get("/:productId", getProductReviews);

export default router;
