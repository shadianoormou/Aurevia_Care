import { createRequest, sql } from "../config/db.js";
import { httpError } from "../utils/http.js";

const allowedKinds = new Set(["doctor", "facility", "diagnostic", "blood_bank", "emergency"]);

const selectColumns = `
  Id, Kind, Name, Specialty, ConditionsJson, Address, Phone, Email, Availability,
  VerificationNote, SourceLabel, SourceUrl, LastVerifiedAt, IsPublished, CreatedAt, UpdatedAt
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
});

const compact = (value) => String(value || "").trim().replace(/\s+/g, " ");
const includesAny = (message, terms) => terms.some((term) => message.includes(term));

const triagePlan = (rawMessage) => {
  const message = rawMessage.toLowerCase();
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
      nextStep: "রাজশাহীতে RMCH emergency desk বা জাতীয় জরুরি সেবা 999-এ যোগাযোগ করুন।",
    };
  }
  if (includesAny(message, ["blood", "blood bank", "রক্ত", "ব্লাড", "donor", "রক্তদাতা"])) {
    return {
      urgency: "priority", kind: "blood_bank", specialty: "Blood support", headline: "রাজশাহীর blood-support contacts",
      message: "রক্তের stock এবং compatibility দ্রুত বদলাতে পারে—যাওয়ার আগে অবশ্যই ফোনে availability ও hospital requirement নিশ্চিত করুন।",
      nextStep: "প্রয়োজনীয় blood group, রোগীর hospital এবং exchange/donor requirement প্রস্তুত রাখুন।",
    };
  }

  const routes = [
    [["pregnan", "period", "menstrual", "gynae", "gyne", "গর্ভ", "প্রেগ", "মাসিক", "নারী"], "Gynecology & obstetrics", "নারী ও প্রসূতি care"],
    [["child", "baby", "infant", "pediatric", "paediatric", "শিশু", "বাচ্চা"], "Pediatrics", "শিশু care"],
    [["skin", "rash", "acne", "allergy", "চামড়া", "ত্বক", "ফুসকুড়ি", "এলার্জ"], "Dermatology", "ত্বক ও allergy care"],
    [["eye", "vision", "চোখ", "দৃষ্টি"], "Ophthalmology", "চোখের care"],
    [["tooth", "dental", "gum", "দাঁত", "মাড়ি"], "Dental", "dental care"],
    [["bone", "joint", "fracture", "back pain", "হাড়", "জয়েন্ট", "ভাঙা", "কোমর"], "Orthopedics", "হাড় ও joint care"],
    [["heart", "palpitation", "cardiac", "হার্ট", "হৃদ"], "Cardiology", "heart care"],
    [["headache", "migraine", "neurology", "head", "মাথাব্যথা", "মাইগ্রেন", "নিউরো"], "Neurology", "neurology care"],
    [["cough", "asthma", "breathing", "chest", "কাশি", "হাঁপানি", "শ্বাস"], "Chest & respiratory medicine", "respiratory care"],
    [["diabetes", "thyroid", "sugar", "ডায়াবেটিস", "থাইরয়েড", "সুগার"], "Medicine / endocrinology", "diabetes ও hormone care"],
    [["mental", "anxiety", "depression", "panic", "মানসিক", "উদ্বেগ", "ডিপ্রেশন"], "Psychiatry", "mental-health care"],
    [["urine", "kidney", "urology", "প্রস্রাব", "কিডনি", "মূত্র"], "Urology / nephrology", "kidney ও urinary care"],
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
  };
};

const findEntries = async ({ kind, query, limit = 8, includeUnpublished = false }) => {
  const request = await createRequest();
  request.input("kind", sql.VarChar(24), kind || null);
  request.input("query", sql.NVarChar(240), query || null);
  request.input("limit", sql.Int, Math.min(Math.max(Number(limit) || 8, 1), 30));
  const { recordset } = await request.query(`
    SELECT TOP (@limit) ${selectColumns}
    FROM dbo.CareDirectoryEntries
    WHERE (${includeUnpublished ? "1 = 1" : "IsPublished = 1"})
      AND (@kind IS NULL OR Kind = @kind)
      AND (@query IS NULL OR Name LIKE '%' + @query + '%' OR Specialty LIKE '%' + @query + '%'
        OR ConditionsJson LIKE '%' + @query + '%' OR Address LIKE '%' + @query + '%')
    ORDER BY CASE WHEN Specialty LIKE '%' + COALESCE(@query, '') + '%' THEN 0 ELSE 1 END,
      LastVerifiedAt DESC, Name ASC
  `);
  return recordset.map(serializeEntry);
};

export const getDirectory = async (req, res, next) => {
  try {
    const kind = compact(req.query.kind);
    if (kind && !allowedKinds.has(kind)) throw httpError("Unsupported directory type");
    const entries = await findEntries({ kind, query: compact(req.query.q), limit: req.query.limit || 18 });
    res.status(200).json({
      success: true,
      city: "Rajshahi",
      sourcePolicy: "Only published, source-attributed directory entries are returned.",
      entries,
    });
  } catch (error) { next(error); }
};

export const askConcierge = async (req, res, next) => {
  try {
    const message = compact(req.body.message);
    if (message.length < 2 || message.length > 800) throw httpError("Enter a question between 2 and 800 characters");
    const plan = triagePlan(message);
    let entries = await findEntries({ kind: plan.kind, query: plan.kind === "blood_bank" ? "" : plan.specialty, limit: 6 });
    if (!entries.length) entries = await findEntries({ kind: plan.kind, query: "", limit: 6 });
    if (!entries.length && plan.kind === "doctor") {
      entries = await findEntries({ kind: "facility", query: "", limit: 4 });
    }
    res.status(200).json({
      success: true,
      city: "Rajshahi",
      careRoute: plan,
      entries,
      safety: "Aurevia Concierge provides directory navigation, not diagnosis, prescriptions, medicine doses, or emergency triage replacement.",
    });
  } catch (error) { next(error); }
};

export { allowedKinds, findEntries, serializeEntry };
