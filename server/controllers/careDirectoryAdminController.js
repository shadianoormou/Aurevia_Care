import { createRequest, sql } from "../config/db.js";
import { httpError, requireUuid } from "../utils/http.js";
import { allowedKinds, findEntries, serializeEntry } from "./careNavigatorController.js";

const text = (value, max = 1000) => {
  const result = String(value || "").trim().replace(/\s+/g, " ");
  if (result.length > max) throw httpError(`A field exceeds its ${max}-character limit`);
  return result;
};

const normaliseEntry = (body) => {
  const kind = text(body.kind, 24);
  if (!allowedKinds.has(kind)) throw httpError("Choose a supported directory type");
  const name = text(body.name, 180);
  const address = text(body.address, 600);
  const sourceLabel = text(body.sourceLabel, 180);
  const sourceUrl = text(body.sourceUrl, 2048);
  const lastVerifiedAt = text(body.lastVerifiedAt, 10);
  if (!name || !address || !sourceLabel || !sourceUrl || !/^https:\/\//i.test(sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(lastVerifiedAt)) {
    throw httpError("Name, address, HTTPS source URL, source label, and verification date are required");
  }
  let conditions = body.conditions;
  if (typeof conditions === "string") conditions = conditions.split(",");
  if (!Array.isArray(conditions)) conditions = [];
  return {
    kind, name, address, sourceLabel, sourceUrl, lastVerifiedAt,
    specialty: text(body.specialty, 180) || null,
    conditions: conditions.map((item) => text(item, 80)).filter(Boolean).slice(0, 30),
    phone: text(body.phone, 200) || null, email: text(body.email, 254) || null,
    availability: text(body.availability, 300) || null, verificationNote: text(body.verificationNote, 500) || null,
    isPublished: body.isPublished !== false,
  };
};

const bindEntry = (request, entry) => {
  request.input("kind", sql.VarChar(24), entry.kind);
  request.input("name", sql.NVarChar(180), entry.name);
  request.input("specialty", sql.NVarChar(180), entry.specialty);
  request.input("conditions", sql.NVarChar(sql.MAX), JSON.stringify(entry.conditions));
  request.input("address", sql.NVarChar(600), entry.address);
  request.input("phone", sql.NVarChar(200), entry.phone);
  request.input("email", sql.NVarChar(254), entry.email);
  request.input("availability", sql.NVarChar(300), entry.availability);
  request.input("verificationNote", sql.NVarChar(500), entry.verificationNote);
  request.input("sourceLabel", sql.NVarChar(180), entry.sourceLabel);
  request.input("sourceUrl", sql.NVarChar(2048), entry.sourceUrl);
  request.input("lastVerifiedAt", sql.Date, entry.lastVerifiedAt);
  request.input("isPublished", sql.Bit, entry.isPublished);
};

export const getAdminDirectory = async (req, res, next) => {
  try {
    const entries = await findEntries({ kind: text(req.query.kind, 24), query: text(req.query.q, 240), limit: 50, includeUnpublished: true });
    res.status(200).json({ success: true, entries });
  } catch (error) { next(error); }
};

export const createDirectoryEntry = async (req, res, next) => {
  try {
    const entry = normaliseEntry(req.body);
    const request = await createRequest();
    bindEntry(request, entry);
    const { recordset } = await request.query(`INSERT INTO dbo.CareDirectoryEntries
      (Kind, Name, Specialty, ConditionsJson, Address, Phone, Email, Availability, VerificationNote, SourceLabel, SourceUrl, LastVerifiedAt, IsPublished)
      OUTPUT inserted.Id, inserted.Kind, inserted.Name, inserted.Specialty, inserted.ConditionsJson, inserted.Address, inserted.Phone, inserted.Email, inserted.Availability, inserted.VerificationNote, inserted.SourceLabel, inserted.SourceUrl, inserted.LastVerifiedAt, inserted.IsPublished, inserted.CreatedAt, inserted.UpdatedAt
      VALUES (@kind, @name, @specialty, @conditions, @address, @phone, @email, @availability, @verificationNote, @sourceLabel, @sourceUrl, @lastVerifiedAt, @isPublished)`);
    res.status(201).json({ success: true, entry: serializeEntry(recordset[0]) });
  } catch (error) { next(error); }
};

export const updateDirectoryEntry = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "directory entry ID");
    const entry = normaliseEntry(req.body);
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    bindEntry(request, entry);
    const { recordset } = await request.query(`UPDATE dbo.CareDirectoryEntries SET
      Kind = @kind, Name = @name, Specialty = @specialty, ConditionsJson = @conditions, Address = @address,
      Phone = @phone, Email = @email, Availability = @availability, VerificationNote = @verificationNote,
      SourceLabel = @sourceLabel, SourceUrl = @sourceUrl, LastVerifiedAt = @lastVerifiedAt,
      IsPublished = @isPublished, UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.Id, inserted.Kind, inserted.Name, inserted.Specialty, inserted.ConditionsJson, inserted.Address, inserted.Phone, inserted.Email, inserted.Availability, inserted.VerificationNote, inserted.SourceLabel, inserted.SourceUrl, inserted.LastVerifiedAt, inserted.IsPublished, inserted.CreatedAt, inserted.UpdatedAt
      WHERE Id = @id`);
    if (!recordset[0]) throw httpError("Directory entry not found", 404);
    res.status(200).json({ success: true, entry: serializeEntry(recordset[0]) });
  } catch (error) { next(error); }
};

// Archive instead of hard deleting: public users no longer see it, while the review trail stays recoverable.
export const archiveDirectoryEntry = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "directory entry ID");
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    const result = await request.query("UPDATE dbo.CareDirectoryEntries SET IsPublished = 0, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id AND IsPublished = 1");
    if (!result.rowsAffected[0]) throw httpError("Published directory entry not found", 404);
    res.status(200).json({ success: true, message: "Directory entry archived" });
  } catch (error) { next(error); }
};
