import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequest, sql, withTransaction } from "../config/db.js";
import { allowedKinds } from "../controllers/careNavigatorController.js";
import { BANGLADESH_LOCATIONS, findDivision, normalizeLocationPart } from "../utils/bangladeshLocations.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(scriptDir, "../data/care-directory.import.example.json");

const compact = (value, max) => {
  const result = String(value ?? "").trim().replace(/\s+/g, " ");
  if (result.length > max) throw new Error(`Field exceeds ${max} characters`);
  return result;
};

const canonicalLocation = (record) => {
  const requestedDivision = compact(record.division, 80);
  const requestedDistrict = compact(record.district, 80);
  const division = requestedDivision ? findDivision(requestedDivision) : null;
  if (requestedDivision && !division) throw new Error(`Unknown Bangladesh division: ${requestedDivision}`);

  let matchedDivision = division;
  let district = null;
  if (requestedDistrict) {
    const candidates = matchedDivision ? [matchedDivision] : BANGLADESH_LOCATIONS;
    for (const candidate of candidates) {
      const found = candidate.districts.find((item) => item.name.toLowerCase() === requestedDistrict.toLowerCase() || item.aliases.some((alias) => alias.toLowerCase() === requestedDistrict.toLowerCase()));
      if (found) { matchedDivision = candidate; district = found.name; break; }
    }
    if (!district) throw new Error(`District does not belong to the supplied Bangladesh location: ${requestedDistrict}`);
  }
  return { division: matchedDivision?.name || null, district };
};

const normalizeRecord = (raw, index) => {
  if (!raw || typeof raw !== "object") throw new Error(`Record ${index + 1} is not an object`);
  const kind = compact(raw.kind, 24);
  const name = compact(raw.name, 180);
  const address = compact(raw.address, 600);
  const sourceLabel = compact(raw.sourceLabel, 180);
  const sourceUrl = compact(raw.sourceUrl, 2048);
  const lastVerifiedAt = compact(raw.lastVerifiedAt, 30);
  if (!allowedKinds.has(kind)) throw new Error(`Record ${index + 1}: unsupported kind "${kind}"`);
  if (!name || !address || !sourceLabel || !/^https:\/\//i.test(sourceUrl)) throw new Error(`Record ${index + 1}: name, address, sourceLabel and an HTTPS sourceUrl are required`);
  if (Number.isNaN(Date.parse(lastVerifiedAt))) throw new Error(`Record ${index + 1}: lastVerifiedAt must be an ISO date`);
  const location = canonicalLocation(raw);
  const conditions = Array.isArray(raw.conditions) ? raw.conditions : typeof raw.conditions === "string" ? raw.conditions.split(",") : [];
  return {
    kind, name, address, sourceLabel, sourceUrl, lastVerifiedAt: new Date(lastVerifiedAt),
    specialty: compact(raw.specialty, 180) || null,
    conditions: conditions.map((item) => compact(item, 80)).filter(Boolean).slice(0, 30),
    phone: compact(raw.phone, 200) || null,
    email: compact(raw.email, 254) || null,
    availability: compact(raw.availability, 300) || null,
    verificationNote: compact(raw.verificationNote, 500) || null,
    division: location.division,
    district: location.district,
    upazila: compact(raw.upazila, 120) || null,
    country: compact(raw.country, 80) || "Bangladesh",
    isPublished: raw.isPublished !== false,
  };
};

const bind = (request, entry) => {
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
  request.input("division", sql.NVarChar(80), entry.division);
  request.input("district", sql.NVarChar(80), entry.district);
  request.input("upazila", sql.NVarChar(120), entry.upazila);
  request.input("country", sql.NVarChar(80), entry.country);
  request.input("isPublished", sql.Bit, entry.isPublished);
};

const upsert = async (transaction, entry) => {
  const lookup = await createRequest(transaction);
  lookup.input("kind", sql.VarChar(24), entry.kind);
  lookup.input("name", sql.NVarChar(180), entry.name);
  const existing = await lookup.query("SELECT TOP 1 Id FROM dbo.CareDirectoryEntries WHERE Kind = @kind AND Name = @name");
  const request = await createRequest(transaction);
  bind(request, entry);
  if (existing.recordset[0]) {
    request.input("id", sql.UniqueIdentifier, existing.recordset[0].Id);
    await request.query(`UPDATE dbo.CareDirectoryEntries SET
      Specialty = @specialty, ConditionsJson = @conditions, Address = @address, Phone = @phone, Email = @email,
      Availability = @availability, VerificationNote = @verificationNote, SourceLabel = @sourceLabel, SourceUrl = @sourceUrl,
      LastVerifiedAt = @lastVerifiedAt, Division = @division, District = @district, Upazila = @upazila, Country = @country,
      IsPublished = @isPublished, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id`);
    return "updated";
  }
  await request.query(`INSERT INTO dbo.CareDirectoryEntries
    (Kind, Name, Specialty, ConditionsJson, Address, Phone, Email, Availability, VerificationNote, SourceLabel, SourceUrl,
      LastVerifiedAt, Division, District, Upazila, Country, IsPublished)
    VALUES (@kind, @name, @specialty, @conditions, @address, @phone, @email, @availability, @verificationNote, @sourceLabel,
      @sourceUrl, @lastVerifiedAt, @division, @district, @upazila, @country, @isPublished)`);
  return "inserted";
};

const main = async () => {
  const inputPath = path.resolve(process.cwd(), process.argv[2] || process.env.DIRECTORY_IMPORT_FILE || defaultFile);
  const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const rawRecords = Array.isArray(payload) ? payload : payload.records;
  if (!Array.isArray(rawRecords)) throw new Error("Import file must be an array or an object with a records array");
  const records = rawRecords.map(normalizeRecord);
  const result = await withTransaction(async (transaction) => {
    const counts = { inserted: 0, updated: 0 };
    for (const entry of records) counts[await upsert(transaction, entry)] += 1;
    return counts;
  });
  console.log(JSON.stringify({ success: true, file: inputPath, records: records.length, ...result }, null, 2));
};

main().catch((error) => { console.error(`Directory import failed: ${error.message}`); process.exitCode = 1; });
