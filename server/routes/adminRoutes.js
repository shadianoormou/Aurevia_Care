import express from "express";
import {
  getStats,
  getLowStockProducts,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  archiveDirectoryEntry, createDirectoryEntry, getAdminDirectory, updateDirectoryEntry,
} from "../controllers/careDirectoryAdminController.js";

const router = express.Router();

router.get("/stats", protect, authorize("admin"), getStats);
router.get("/low-stock", protect, authorize("admin", "pharmacist"), getLowStockProducts);

router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/users/:id", protect, authorize("admin"), updateUser);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

router.get("/care-directory", protect, authorize("admin"), getAdminDirectory);
router.post("/care-directory", protect, authorize("admin"), createDirectoryEntry);
router.put("/care-directory/:id", protect, authorize("admin"), updateDirectoryEntry);
router.delete("/care-directory/:id", protect, authorize("admin"), archiveDirectoryEntry);

export default router;
