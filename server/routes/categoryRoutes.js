import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/admin", protect, authorize("admin"), createCategory);
router.put("/admin/:id", protect, authorize("admin"), updateCategory);
router.delete("/admin/:id", protect, authorize("admin"), deleteCategory);

export default router;
