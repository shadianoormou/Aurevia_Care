import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);

// Admin routes (declared before /:id so they aren't shadowed)
router.get("/admin", protect, authorize("admin", "pharmacist"), getAllOrders);
router.put("/admin/:id/status", protect, authorize("admin"), updateOrderStatus);

router.get("/:id", protect, getOrderById);

export default router;
