import { createRequest, sql } from "../config/db.js";
import { extractPrescriptionText } from "../utils/prescriptionScan.js";
import { cleanText, httpError, requireUuid } from "../utils/http.js";
import { serializePrescription } from "../utils/serializers.js";

const prescriptionColumns = "Id, UserId, Mode, Status, DoctorName, DoctorRegistration, PrescriptionNumber, MedicationDetails, Note, FileName, FileMimeType, FileSize, ScanText, RejectionReason, VerifiedBy, VerifiedAt, ExpiresAt, CreatedAt, UpdatedAt";

const outputColumns = prescriptionColumns.replaceAll(", ", ", inserted.");
const qualifiedPrescriptionColumns = prescriptionColumns.split(", ").map((column) => `p.${column}`).join(", ");

const selectPrescription = async (id) => {
  const request = await createRequest();
  request.input("id", sql.UniqueIdentifier, id);
  const { recordset } = await request.query(`SELECT ${prescriptionColumns} FROM dbo.Prescriptions WHERE Id = @id`);
  return recordset[0] || null;
};

const parseExpiry = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw httpError("Prescription expiry date is invalid");
  if (date <= new Date()) throw httpError("Prescription expiry date must be in the future");
  return date;
};

const createPrescription = async ({ userId, mode, fields, file, scanText }) => {
  const request = await createRequest();
  request.input("userId", sql.UniqueIdentifier, userId);
  request.input("mode", sql.VarChar(12), mode);
  request.input("doctorName", sql.NVarChar(160), fields.doctorName || null);
  request.input("doctorRegistration", sql.NVarChar(100), fields.doctorRegistration || null);
  request.input("prescriptionNumber", sql.NVarChar(100), fields.prescriptionNumber || null);
  request.input("medicationDetails", sql.NVarChar(sql.MAX), fields.medicationDetails || null);
  request.input("note", sql.NVarChar(2000), fields.note || null);
  request.input("fileName", sql.NVarChar(255), file?.originalname || null);
  request.input("fileMimeType", sql.NVarChar(100), file?.mimetype || null);
  request.input("fileSize", sql.Int, file?.size || null);
  request.input("fileData", sql.VarBinary(sql.MAX), file?.buffer || null);
  request.input("scanText", sql.NVarChar(sql.MAX), scanText || null);
  const { recordset } = await request.query(`INSERT INTO dbo.Prescriptions
    (UserId, Mode, DoctorName, DoctorRegistration, PrescriptionNumber, MedicationDetails, Note,
     FileName, FileMimeType, FileSize, FileData, ScanText)
    OUTPUT inserted.${outputColumns}
    VALUES (@userId, @mode, @doctorName, @doctorRegistration, @prescriptionNumber, @medicationDetails,
      @note, @fileName, @fileMimeType, @fileSize, @fileData, @scanText)`);
  return recordset[0];
};

export const uploadPrescriptionScan = async (req, res, next) => {
  try {
    if (!req.file) throw httpError("Choose a prescription image or PDF to upload");
    const fields = {
      doctorName: cleanText(req.body.doctorName, 160), doctorRegistration: cleanText(req.body.doctorRegistration, 100),
      prescriptionNumber: cleanText(req.body.prescriptionNumber, 100), medicationDetails: cleanText(req.body.medicationDetails, 12000),
      note: cleanText(req.body.note, 2000),
    };
    let scanText = "";
    try { scanText = await extractPrescriptionText(req.file); } catch (error) {
      console.warn("Prescription OCR skipped:", error.message);
    }
    const prescription = await createPrescription({ userId: req.user._id, mode: "scan", fields, file: req.file, scanText });
    res.status(201).json({
      success: true, prescription: serializePrescription(prescription),
      message: scanText ? "Prescription scanned and queued for pharmacist verification" : "Prescription securely received and queued for pharmacist verification",
    });
  } catch (error) { next(error); }
};

export const submitManualPrescription = async (req, res, next) => {
  try {
    const fields = {
      doctorName: cleanText(req.body.doctorName, 160), doctorRegistration: cleanText(req.body.doctorRegistration, 100),
      prescriptionNumber: cleanText(req.body.prescriptionNumber, 100), medicationDetails: cleanText(req.body.medicationDetails, 12000),
      note: cleanText(req.body.note, 2000),
    };
    if (!fields.doctorName || !fields.medicationDetails) {
      throw httpError("Prescriber name and medication details are required for manual entry");
    }
    const prescription = await createPrescription({ userId: req.user._id, mode: "manual", fields });
    res.status(201).json({ success: true, prescription: serializePrescription(prescription), message: "Manual prescription submitted for pharmacist verification" });
  } catch (error) { next(error); }
};

export const getMyPrescriptions = async (req, res, next) => {
  try {
    const request = await createRequest();
    request.input("userId", sql.UniqueIdentifier, req.user._id);
    const { recordset } = await request.query(`SELECT ${prescriptionColumns} FROM dbo.Prescriptions
      WHERE UserId = @userId ORDER BY CreatedAt DESC`);
    res.status(200).json({ success: true, prescriptions: recordset.map(serializePrescription) });
  } catch (error) { next(error); }
};

export const getPrescriptionQueue = async (req, res, next) => {
  try {
    const status = req.query.status;
    if (status && !["Pending", "Approved", "Rejected", "Expired"].includes(status)) throw httpError("Invalid prescription status");
    const request = await createRequest();
    if (status) request.input("status", sql.VarChar(12), status);
    const { recordset } = await request.query(`SELECT ${qualifiedPrescriptionColumns}, u.Name AS UserName, u.Email AS UserEmail
      FROM dbo.Prescriptions p INNER JOIN dbo.Users u ON u.Id = p.UserId
      ${status ? "WHERE p.Status = @status" : ""} ORDER BY p.CreatedAt ASC`);
    res.status(200).json({
      success: true,
      prescriptions: recordset.map((row) => ({ ...serializePrescription(row), user: { _id: row.UserId, name: row.UserName, email: row.UserEmail } })),
    });
  } catch (error) { next(error); }
};

export const reviewPrescription = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "prescription ID");
    const status = req.body.status;
    if (!["Approved", "Rejected"].includes(status)) throw httpError("Prescription status must be Approved or Rejected");
    const rejectionReason = cleanText(req.body.rejectionReason, 1000);
    if (status === "Rejected" && !rejectionReason) throw httpError("Give the customer a reason when rejecting a prescription");
    const expiresAt = status === "Approved" ? parseExpiry(req.body.expiresAt) : null;
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    request.input("status", sql.VarChar(12), status);
    request.input("verifiedBy", sql.UniqueIdentifier, req.user._id);
    request.input("rejectionReason", sql.NVarChar(1000), status === "Rejected" ? rejectionReason : null);
    request.input("expiresAt", sql.DateTime2, expiresAt);
    const { recordset } = await request.query(`UPDATE dbo.Prescriptions SET Status = @status,
      VerifiedBy = @verifiedBy, VerifiedAt = SYSUTCDATETIME(), RejectionReason = @rejectionReason,
      ExpiresAt = @expiresAt, UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.${outputColumns} WHERE Id = @id AND Status = 'Pending'`);
    if (!recordset[0]) throw httpError("Only a pending prescription can be reviewed", 409);
    res.status(200).json({ success: true, prescription: serializePrescription(recordset[0]) });
  } catch (error) { next(error); }
};

export const downloadPrescriptionFile = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "prescription ID");
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    const { recordset } = await request.query("SELECT UserId, FileName, FileMimeType, FileData FROM dbo.Prescriptions WHERE Id = @id");
    const file = recordset[0];
    if (!file || !file.FileData) throw httpError("Prescription file not found", 404);
    const isStaff = ["admin", "pharmacist"].includes(req.user.role);
    if (!isStaff && file.UserId !== req.user._id) throw httpError("Not authorized to access this prescription", 403);
    res.set({ "Content-Type": file.FileMimeType, "Content-Disposition": `inline; filename="${encodeURIComponent(file.FileName)}"`, "Cache-Control": "private, no-store" });
    res.send(file.FileData);
  } catch (error) { next(error); }
};
