import express from "express";
import {
  getProducts,
  getProductById,
  smartSearch,
  getRecommendations,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  verifyProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Public routes
router.get("/search", smartSearch);
router.get("/recommendations", getRecommendations);
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin routes
router.post("/admin", protect, authorize("admin"), upload.single("image"), createProduct);
router.put("/admin/:id", protect, authorize("admin"), upload.single("image"), updateProduct);
router.delete("/admin/:id", protect, authorize("admin"), deleteProduct);

// Admin + Pharmacist can update stock
router.put("/admin/:id/stock", protect, authorize("admin", "pharmacist"), updateStock);

// Admin + Pharmacist can verify/unverify a product's medicine information
router.put("/admin/:id/verify", protect, authorize("admin", "pharmacist"), verifyProduct);

export default router;
