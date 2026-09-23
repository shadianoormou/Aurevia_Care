import { createRequest, sql } from "../config/db.js";
import { httpError } from "../utils/http.js";
import { matchBangladeshLocation, serializeLocationOptions, normalizeLocationPart } from "../utils/bangladeshLocations.js";

const allowedKinds = new Set(["doctor", "facility", "diagnostic", "blood_bank", "emergency"]);

const selectColumns = `
  Id, Kind, Name, Specialty, ConditionsJson, Address, Phone, Email, Availability,
  VerificationNote, SourceLabel, SourceUrl, LastVerifiedAt, IsPublished, Division, District, Upazila, Country,
  CreatedAt, UpdatedAt
`;

const serializeEntry = (row) => ({
  _id: row.Id,
  kind: row.Kind,
  name: row.Name,
  specialty: row.Specialty,
  conditions: (() => { try { return JSON.parse(row.ConditionsJson || "[]"); } catch { return []; } })(),
  address: row.Address,
  phone: row.Phone,
  email: row.Email,
  availability: row.Availability,
  verificationNote: row.VerificationNote,
  sourceLabel: row.SourceLabel,
  sourceUrl: row.SourceUrl,
  lastVerifiedAt: row.LastVerifiedAt,
  isPublished: Boolean(row.IsPublished),
  location: {
    country: row.Country || "Bangladesh",
    division: row.Division || null,
    district: row.District || null,
    upazila: row.Upazila || null,
    label: [...new Set([row.Upazila, row.District, row.Division].filter(Boolean))].join(", ") || "Bangladesh",
  },
});

const compact = (value) => String(value || "").trim().replace(/\s+/g, " ");
const includesAny = (message, terms) => terms.some((term) => message.includes(term));

const triagePlan = (rawMessage) => {
  const message = rawMessage.toLowerCase();
  const location = matchBangladeshLocation(rawMessage);
  const emergencyTerms = [
    "chest pain", "বুকে ব্যথা", "difficulty breathing", "shortness of breath", "শ্বাস কষ্ট", "শ্বাসকষ্ট",
    "unconscious", "faint", "অজ্ঞান", "severe bleeding", "রক্তক্ষরণ", "stroke", "paralysis", "প্যারালাইসিস",
    "suicide", "self harm", "আত্মহত্যা", "খিঁচুনি", "seizure",
  ];
  if (includesAny(message, emergencyTerms)) {
    return {
      urgency: "emergency",
      kind: "emergency",
      specialty: "Emergency care",
      headline: "জরুরি সহায়তা দরকার হতে পারে",
      message: "এটি online diagnosis নয়। এখনই নিকটস্থ emergency department-এ যান বা জরুরি সহায়তা নিন—chat-এ অপেক্ষা করবেন না।",
      nextStep: "নিকটস্থ emergency department-এ যান বা জাতীয় জরুরি সেবা 999-এ যোগাযোগ করুন।",
      location,
    };
  }
  if (includesAny(message, ["blood", "blood bank", "রক্ত", "ব্লাড", "donor", "রক্তদাতা"])) {
    return {
      urgency: "priority", kind: "blood_bank", specialty: "Blood support", headline: location ? `${location.label}-এর blood-support contacts` : "আপনার এলাকার blood-support contacts",
      message: "রক্তের stock এবং compatibility দ্রুত বদলাতে পারে—যাওয়ার আগে অবশ্যই ফোনে availability ও hospital requirement নিশ্চিত করুন।",
      nextStep: "প্রয়োজনীয় blood group, রোগীর hospital এবং exchange/donor requirement প্রস্তুত রাখুন।",
      location,
    };
  }

  const routes = [
    [["toothache", "tooth pain", "dental pain", "gum pain", "tooth ache", "dath betha", "daat betha", "dant betha", "dat betha", "dath", "দাঁত ব্যথা", "দাঁতের ব্যথা", "দাত ব্যথা", "দাঁতের যন্ত্রণা", "মাড়ি ব্যথা", "মাড়ি ব্যথা", "দাঁত", "দাত", "দাঁতের"], "Dental", "দাঁত ও মুখের care", "tooth"],
    [["pregnan", "period", "menstrual", "gynae", "gyne", "গর্ভ", "প্রেগ", "মাসিক", "নারী"], "Gynecology & obstetrics", "নারী ও প্রসূতি care", "gynecology"],
    [["child", "baby", "infant", "pediatric", "paediatric", "শিশু", "বাচ্চা"], "Pediatrics", "শিশু care", "child"],
    [["skin", "rash", "acne", "allergy", "চামড়া", "ত্বক", "ফুসকুড়ি", "এলার্জ"], "Dermatology", "ত্বক ও allergy care", "skin"],
    [["eye", "vision", "চোখ", "দৃষ্টি"], "Ophthalmology", "চোখের care", "eye"],
    [["tooth", "dental", "gum", "দাঁত", "মাড়ি"], "Dental", "dental care", "tooth"],
    [["bone", "joint", "fracture", "back pain", "হাড়", "জয়েন্ট", "ভাঙা", "কোমর"], "Orthopedics", "হাড় ও joint care", "orthopedic"],
    [["heart", "palpitation", "cardiac", "heart pain", "heart attack", "angina", "buk dhorfor", "buk dorfor", "হার্ট", "হৃদ", "বুক ধড়ফড়", "বুক ধড়ফড়"], "Cardiology", "heart care", "heart"],
    [["headache", "migraine", "neurology", "head", "matha betha", "মাথাব্যথা", "মাথা ব্যথা", "মাইগ্রেন", "নিউরো"], "Neurology", "neurology care", "neurology"],
    [["cough", "kashi", "asthma", "breathing", "chest", "cold", "sordi", "shordi", "কাশি", "হাঁপানি", "শ্বাস"], "Chest & respiratory medicine", "respiratory care", "respiratory"],
    [["diabetes", "thyroid", "sugar", "ডায়াবেটিস", "থাইরয়েড", "সুগার"], "Medicine / endocrinology", "diabetes ও hormone care", "diabetes"],
    [["mental", "anxiety", "depression", "panic", "মানসিক", "উদ্বেগ", "ডিপ্রেশন"], "Psychiatry", "mental-health care", "mental"],
    [["urine", "kidney", "urology", "প্রস্রাব", "কিডনি", "মূত্র"], "Urology / nephrology", "kidney ও urinary care", "kidney"],
  ];
  const route = routes.find(([terms]) => includesAny(message, terms));
  const specialty = route?.[1] || "General medicine";
  return {
    urgency: "routine", kind: "doctor", specialty,
    headline: route ? `সম্ভাব্য care route: ${route[2]}` : "কোন department দিয়ে শুরু করবেন",
    message: route
      ? `আপনার বলা বিষয়টির জন্য ${specialty} department-এর clinician-এর সাথে কথা বলা উপযোগী হতে পারে।`
      : "লক্ষণটি যদি নতুন, স্থায়ী বা বাড়তে থাকে, General Medicine/OPD দিয়ে শুরু করুন; তারা প্রয়োজন হলে specialist route দেবেন।",
    nextStep: "নিচের verified directory থেকে appointment line-এ কল করে সময় নিশ্চিত করুন।",
    directoryQuery: route?.[3] || null,
    location,
  };
};

const findEntries = async ({ kind, query, division, district, upazila, limit = 8, includeUnpublished = false }) => {
  const request = await createRequest();
  request.input("kind", sql.VarChar(24), kind || null);
  request.input("query", sql.NVarChar(240), query || null);
  request.input("division", sql.NVarChar(80), division || null);
  request.input("district", sql.NVarChar(80), district || null);
  request.input("upazila", sql.NVarChar(120), upazila || null);
  request.input("limit", sql.Int, Math.min(Math.max(Number(limit) || 8, 1), 30));
  const { recordset } = await request.query(`
    SELECT TOP (@limit) ${selectColumns}
    FROM dbo.CareDirectoryEntries
    WHERE (${includeUnpublished ? "1 = 1" : "IsPublished = 1"})
      AND (@kind IS NULL OR Kind = @kind)
      AND (@division IS NULL OR Division = @division)
      AND (@district IS NULL OR District = @district)
      AND (@upazila IS NULL OR Upazila = @upazila)
      AND (@query IS NULL OR Name LIKE '%' + @query + '%' OR Specialty LIKE '%' + @query + '%'
        OR ConditionsJson LIKE '%' + @query + '%' OR Address LIKE '%' + @query + '%'
        OR Division LIKE '%' + @query + '%' OR District LIKE '%' + @query + '%' OR Upazila LIKE '%' + @query + '%')
    ORDER BY CASE WHEN Specialty LIKE '%' + COALESCE(@query, '') + '%' THEN 0 ELSE 1 END,
      LastVerifiedAt DESC, Name ASC
  `);
  return recordset.map(serializeEntry);
};

export const getDirectory = async (req, res, next) => {
  try {
    const kind = compact(req.query.kind);
    if (kind && !allowedKinds.has(kind)) throw httpError("Unsupported directory type");
    const requestedLocation = compact(req.query.location || req.query.city || "");
    const location = matchBangladeshLocation(requestedLocation) || {
      division: normalizeLocationPart(req.query.division),
      district: normalizeLocationPart(req.query.district),
      upazila: normalizeLocationPart(req.query.upazila),
      label: [req.query.upazila, req.query.district, req.query.division].filter(Boolean).join(", ") || "Bangladesh",
    };
    const hasLocation = Boolean(location.division || location.district || location.upazila);
    const entries = await findEntries({ kind, query: compact(req.query.q), ...(hasLocation ? location : {}), limit: req.query.limit || 18 });
    res.status(200).json({
      success: true,
      scope: location.label || "Bangladesh",
      location,
      coverage: entries.length ? "verified_records" : "no_published_records_for_location",
      locations: serializeLocationOptions(),
      sourcePolicy: "Only published, source-attributed directory entries are returned.",
      entries,
    });
  } catch (error) { next(error); }
};

export const getLocations = async (_req, res) => {
  res.status(200).json({ success: true, country: "Bangladesh", locations: serializeLocationOptions() });
};

export const askConcierge = async (req, res, next) => {
  try {
    const message = compact(req.body.message);
    if (message.length < 2 || message.length > 800) throw httpError("Enter a question between 2 and 800 characters");
    const plan = triagePlan(message);
    const location = plan.location || {};
    const locationFilter = location.division || location.district ? { division: location.division, district: location.district, upazila: location.upazila } : {};
    const directoryQuery = plan.kind === "blood_bank" ? "" : plan.directoryQuery || plan.specialty;
    let entries = await findEntries({ kind: plan.kind, query: directoryQuery, ...locationFilter, limit: 10 });
    // Never fill a specialist request with an unrelated doctor. An empty result is safer
    // than showing a cardiologist for cough, or an orthopedist for tooth pain.
    if (!entries.length && plan.kind === "doctor") {
      entries = await findEntries({ kind: "facility", query: "", ...locationFilter, limit: 4 });
    }
    res.status(200).json({
      success: true,
      scope: location.label || "Bangladesh",
      location: location.label ? location : null,
      coverage: entries.length ? "verified_records" : "no_published_records_for_location",
      careRoute: plan,
      entries,
      safety: "Aurevia Concierge provides directory navigation, not diagnosis, prescriptions, medicine doses, or emergency triage replacement.",
    });
  } catch (error) { next(error); }
};

export { allowedKinds, findEntries, serializeEntry, triagePlan };
