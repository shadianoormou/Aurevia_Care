import express from "express";
import {
  getStats,
  getLowStockProducts,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", protect, authorize("admin"), getStats);
router.get("/low-stock", protect, authorize("admin", "pharmacist"), getLowStockProducts);

router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/users/:id", protect, authorize("admin"), updateUser);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

export default router;
