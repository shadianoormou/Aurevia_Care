import express from "express";
import {
  downloadPrescriptionFile,
  getMyPrescriptions,
  getPrescriptionQueue,
  reviewPrescription,
  submitManualPrescription,
  uploadPrescriptionScan,
} from "../controllers/prescriptionController.js";
import { authorize, protect } from "../middleware/auth.js";
import { prescriptionUpload } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/scan", protect, prescriptionUpload.single("file"), uploadPrescriptionScan);
router.post("/manual", protect, submitManualPrescription);
router.get("/my", protect, getMyPrescriptions);
router.get("/admin", protect, authorize("admin", "pharmacist"), getPrescriptionQueue);
router.put("/admin/:id", protect, authorize("admin", "pharmacist"), reviewPrescription);
router.get("/:id/file", protect, downloadPrescriptionFile);

export default router;
