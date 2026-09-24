// Development/bootstrap catalogue only. Run migrations before this command.
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB, sql } from "../config/db.js";

dotenv.config();

const categories = [
  { name: "Medicines & Wellness", description: "OTC essentials, symptom-led care, vitamins and prescription fulfilment", icon: "💊", sortOrder: 1, subcategories: [
    ["Headache & Pain", "Headache, body-pain and recovery essentials", "◌"], ["Cold, Cough & Allergy", "Seasonal respiratory comfort", "◌"],
    ["Digestive & Hydration", "Hydration and digestive essentials", "◌"], ["Vitamins & Wellness", "Daily nutrition and wellbeing", "◌"],
    ["Prescription & Chronic Care", "Pharmacist-reviewed prescription fulfilment", "◌"],
  ] },
  { name: "Skin Care", description: "Thoughtful daily skincare and dermatologist-aware essentials", icon: "✦", sortOrder: 2, subcategories: [
    ["Cleansers & Acne Care", "Gentle cleansing and blemish-prone skin care", "◌"], ["Moisturisers & Barrier Care", "Hydration and barrier support", "◌"],
    ["Sun Protection", "Daily UV protection", "◌"], ["Sensitive Skin", "Comfort-focused simple formulas", "◌"],
  ] },
  { name: "Hair & Scalp", description: "Everyday hair, scalp and anti-dandruff care", icon: "〰", sortOrder: 3, subcategories: [
    ["Daily Shampoo", "Cleansing for everyday routines", "◌"], ["Anti-Dandruff", "Scalp-focused cleansing", "◌"],
    ["Conditioner & Repair", "Softness and manageability", "◌"], ["Hair Fall Care", "Scalp and hair-care routines", "◌"],
  ] },
  { name: "Oral & Dental", description: "Tooth, gum and fresh-breath care", icon: "◡", sortOrder: 4, subcategories: [
    ["Toothpaste", "Daily fluoride toothpaste", "◌"], ["Sensitive Teeth", "Comfort-focused oral care", "◌"],
    ["Gum Care", "Daily gum-care essentials", "◌"], ["Mouthwash", "Fresh-breath routines", "◌"],
  ] },
  { name: "Creams & First Aid", description: "Pharmaceutical creams, gels and practical first-aid care", icon: "✚", sortOrder: 5, subcategories: [
    ["Antiseptic & Wound Care", "Minor-cut and superficial-care essentials", "◌"], ["Pain Relief Gels", "Topical comfort products", "◌"],
    ["Protective Creams", "Hands, body and dry-skin protection", "◌"], ["First Aid", "Home and travel-kit basics", "◌"],
  ] },
];

const products = [
  { name: "Paracetamol 500mg · 10 tablets", brand: "Aurevia Essentials", category: "Medicines & Wellness", subcategory: "Headache & Pain", description: "For temporary relief of fever, headache, and minor aches. Always follow the label directions.", symptoms: ["fever", "headache", "body pain"], price: 30, stock: 150, threshold: 20, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900", rx: false },
  { name: "Ibuprofen 400mg · 10 tablets", brand: "Aurevia Essentials", category: "Medicines & Wellness", subcategory: "Headache & Pain", description: "Anti-inflammatory pain relief. Ask a pharmacist if you have stomach, kidney, or heart concerns.", symptoms: ["headache", "body pain"], price: 45, stock: 40, threshold: 15, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=900", rx: false },
  { name: "Cough Comfort Syrup · 100ml", brand: "CalmTuss", category: "Medicines & Wellness", subcategory: "Cold, Cough & Allergy", description: "Soothing relief for occasional cough and throat irritation.", symptoms: ["cough", "sore throat"], price: 80, stock: 60, threshold: 10, image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900", rx: false },
  { name: "Oral Rehydration Salts", brand: "HydraLyte", category: "Medicines & Wellness", subcategory: "Digestive & Hydration", description: "Electrolyte support for hydration. Seek medical advice for persistent symptoms.", symptoms: ["diarrhea", "vomiting"], price: 20, stock: 100, threshold: 20, image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900", rx: false },
  { name: "Daily Multivitamin · 30 tablets", brand: "VitaBoost", category: "Medicines & Wellness", subcategory: "Vitamins & Wellness", description: "Daily multivitamin formulated to support everyday nutrition.", symptoms: ["vitamin"], price: 120, stock: 75, threshold: 15, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=900", rx: false },
  { name: "Vitamin C 1000mg · Effervescent", brand: "ImmunoFizz", category: "Medicines & Wellness", subcategory: "Vitamins & Wellness", description: "Effervescent vitamin C supplement for daily wellness support.", symptoms: ["cold", "vitamin"], price: 95, stock: 50, threshold: 10, image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=900", rx: false },
  { name: "Antiseptic Cream · 30g", brand: "SkinGuard", category: "Creams & First Aid", subcategory: "Antiseptic & Wound Care", description: "For minor cuts and superficial skin care. Read the product label before use.", symptoms: ["skin rash"], price: 55, stock: 45, threshold: 10, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900", rx: false },
  { name: "Amoxicillin 500mg · 21 capsules", brand: "Aurevia Rx", category: "Medicines & Wellness", subcategory: "Prescription & Chronic Care", description: "Prescription-only antibiotic. A pharmacist must verify an approved prescription before fulfilment.", symptoms: ["infection"], price: 180, stock: 25, threshold: 10, image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900", rx: true },
  { name: "Metformin 500mg · 30 tablets", brand: "Aurevia Rx", category: "Medicines & Wellness", subcategory: "Prescription & Chronic Care", description: "Prescription-only medicine. A pharmacist must verify an approved prescription before fulfilment.", symptoms: ["diabetes"], price: 150, stock: 40, threshold: 10, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=900", rx: true },
  { name: "Hydra Balance Face Cleanser · 100ml", brand: "Aurevia Skin", category: "Skin Care", subcategory: "Cleansers & Acne Care", description: "A gentle everyday cleanser for a simple skin-care routine.", symptoms: ["skin care", "cleanser"], price: 380, stock: 45, threshold: 10, image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=900", rx: false },
  { name: "Daily Mineral Sunscreen SPF 50 · 50ml", brand: "Aurevia Skin", category: "Skin Care", subcategory: "Sun Protection", description: "Daily broad-spectrum sun-protection cosmetic. Reapply according to the label.", symptoms: ["sun care", "skin care"], price: 690, stock: 38, threshold: 8, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=900", rx: false },
  { name: "Barrier Repair Moisturising Cream · 50g", brand: "Aurevia Skin", category: "Skin Care", subcategory: "Moisturisers & Barrier Care", description: "A comfort-focused moisturising cream for everyday dry-skin care.", symptoms: ["dry skin", "skin care"], price: 460, stock: 52, threshold: 10, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=900", rx: false },
  { name: "Nourishing Daily Shampoo · 200ml", brand: "Aurevia Hair", category: "Hair & Scalp", subcategory: "Daily Shampoo", description: "A gentle shampoo for an everyday hair-care routine.", symptoms: ["hair care", "shampoo"], price: 320, stock: 55, threshold: 12, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=900", rx: false },
  { name: "Scalp Balance Anti-Dandruff Shampoo · 180ml", brand: "Aurevia Hair", category: "Hair & Scalp", subcategory: "Anti-Dandruff", description: "Scalp-focused cleansing. Consult a clinician for persistent scalp symptoms.", symptoms: ["dandruff", "scalp"], price: 420, stock: 36, threshold: 10, image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900", rx: false },
  { name: "Smooth Care Conditioner · 180ml", brand: "Aurevia Hair", category: "Hair & Scalp", subcategory: "Conditioner & Repair", description: "A daily conditioner for softness and manageability.", symptoms: ["hair care", "conditioner"], price: 360, stock: 42, threshold: 10, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=900", rx: false },
  { name: "Fluoride Care Toothpaste · 100g", brand: "Aurevia Oral", category: "Oral & Dental", subcategory: "Toothpaste", description: "Daily toothpaste for routine oral hygiene. Use as directed on the pack.", symptoms: ["toothpaste", "oral care"], price: 180, stock: 80, threshold: 15, image: "https://images.unsplash.com/photo-1559591937-abc7f8a9c700?w=900", rx: false },
  { name: "Sensitive Teeth Toothpaste · 75g", brand: "Aurevia Oral", category: "Oral & Dental", subcategory: "Sensitive Teeth", description: "A sensitivity-focused toothpaste for routine care. See a dentist for persistent pain.", symptoms: ["sensitive teeth", "oral care"], price: 260, stock: 48, threshold: 10, image: "https://images.unsplash.com/photo-1559591937-abc7f8a9c700?w=900", rx: false },
  { name: "Fresh Mint Mouthwash · 250ml", brand: "Aurevia Oral", category: "Oral & Dental", subcategory: "Mouthwash", description: "Alcohol-free mouthwash for a fresh-breath routine.", symptoms: ["mouthwash", "oral care"], price: 240, stock: 40, threshold: 10, image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=900", rx: false },
  { name: "Cooling Muscle Comfort Gel · 30g", brand: "Aurevia First Aid", category: "Creams & First Aid", subcategory: "Pain Relief Gels", description: "Topical comfort gel. Read the product label and consult a pharmacist if unsure.", symptoms: ["body pain", "muscle"], price: 210, stock: 44, threshold: 10, image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900", rx: false },
  { name: "Protective Hand Cream · 50g", brand: "Aurevia First Aid", category: "Creams & First Aid", subcategory: "Protective Creams", description: "A rich everyday hand-care cream for dry skin.", symptoms: ["dry skin", "hand care"], price: 250, stock: 35, threshold: 8, image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=900", rx: false },
];

// Source-attributed starter data for the Rajshahi concierge. This is deliberately
// small and editable: availability and chamber schedules must be confirmed before a visit.
const careDirectory = [
  {
    kind: "emergency", name: "Rajshahi Medical College Hospital · Emergency", specialty: "Emergency care",
    conditions: ["emergency", "chest pain", "breathing difficulty", "injury", "severe bleeding"],
    address: "Laxmipur, Rajshahi 6000, Bangladesh", phone: "01321-180514", availability: "24/7 emergency line",
    note: "For ambulance: 01321-180516. Do not wait for an online reply in an emergency.",
    sourceLabel: "Rajshahi Medical College Hospital · official contact", sourceUrl: "https://rmch.gov.bd/contact-us/",
  },
  {
    kind: "facility", name: "Rajshahi Medical College Hospital · Helpdesk & OPD", specialty: "General medicine, specialist referral and hospital information",
    conditions: ["fever", "headache", "cough", "general medicine", "opd", "doctor"],
    address: "Laxmipur, Rajshahi 6000, Bangladesh", phone: "01958-509495", email: "rmch@hospi.dghs.gov.bd",
    availability: "Confirm current service hours by phone", note: "Government facility record and official hospital contact.",
    sourceLabel: "RMCH official contact", sourceUrl: "https://rmch.gov.bd/contact-us/",
  },
  {
    kind: "diagnostic", name: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", specialty: "Diagnostic tests and specialist consultation",
    conditions: ["diagnostic", "lab", "test", "consultation", "doctor serial"],
    address: "House 223 & 224, Kazihata (opposite Television Centre), Rajpara, Rajshahi", phone: "09610-009636",
    availability: "Call to confirm doctor serial, test availability and report collection", note: "Official branch contact.",
    sourceLabel: "Ibn Sina Trust · Rajshahi contact", sourceUrl: "https://ibnsinatrust.com/contact.php",
  },
  {
    kind: "doctor", name: "Dr. Md. Munzur Rahman (Shimul)", specialty: "Orthopedics and trauma surgery",
    conditions: ["bone", "joint", "fracture", "orthopedic", "trauma", "back pain"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 7, Room 710", phone: "09610-009636",
    availability: "Normal chamber: 4:00 PM–7:00 PM; off Monday and Friday. Confirm before travel.", note: "Appointment line and normal chamber schedule are published by the provider; schedules can change.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=689",
  },
  {
    kind: "doctor", name: "Prof. Dr. Md. Abdus Sobhan", specialty: "Orthopedics and trauma surgery",
    conditions: ["bone", "joint", "fracture", "orthopedic", "trauma", "spine"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", phone: "09610-009636",
    availability: "Normal chamber: Saturday, Monday, Wednesday 4:00 PM–8:00 PM. Confirm before travel.", note: "Appointment line and normal chamber schedule are published by the provider; schedules can change.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=689",
  },
  {
    kind: "doctor", name: "Dr. AKM Rezwanul Islam (Maruf)", specialty: "Cardiology",
    conditions: ["heart", "cardiology", "palpitation", "blood pressure"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", phone: "09610-009636",
    availability: "Call the appointment line to confirm chamber time", note: "Directory listing is provider-published; call before visiting.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/index.php/Index/view_departmentwiseDoctor.php?id=637",
  },
  {
    kind: "doctor", name: "Dr. Shish Mohammad Sarkar", specialty: "Chest, respiratory, pulmonology and asthma",
    conditions: ["cough", "asthma", "chest", "respiratory", "breathing"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", phone: "09610-009636",
    availability: "Call the appointment line to confirm chamber time", note: "Directory listing is provider-published; call before visiting.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/index.php/Index/view_departmentwiseDoctor.php?id=350",
  },
  {
    kind: "doctor", name: "Dr. Mousomi Sarkar", specialty: "Gynecology and obstetrics",
    conditions: ["pregnancy", "gynae", "gynecology", "women", "menstrual"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", phone: "09610-009636",
    availability: "Call the appointment line to confirm chamber time", note: "Directory listing is provider-published; call before visiting.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/index.php/Index/view_departmentwiseDoctor.php?id=350",
  },
  {
    kind: "doctor", name: "Dr. Md. Shohel Rana", specialty: "General physician",
    conditions: ["fever", "cough", "cold", "general medicine", "doctor"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", phone: "09610-009636",
    availability: "Call the appointment line to confirm chamber time", note: "Directory listing is provider-published; call before visiting.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/index.php/Index/view_departmentwiseDoctor.php?id=367",
  },
  {
    kind: "doctor", name: "Dr. Isratunnahar Shimu", specialty: "Dental surgery",
    conditions: ["dental", "tooth", "gum", "oral"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi", phone: "09610-009636",
    availability: "Call the appointment line to confirm chamber time", note: "Directory listing is provider-published; call before visiting.",
    sourceLabel: "Ibn Sina Trust · doctor directory", sourceUrl: "https://ibnsinatrust.com/index.php/Index/view_departmentwiseDoctor.php?id=367",
  },
  {
    kind: "doctor", name: "Asso Prof. Dr. Md. Nurul Islam", specialty: "Medicine Specialist",
    conditions: ["fever", "cough", "cold", "general medicine", "internal medicine", "medicine"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 804", phone: "09610-009636",
    availability: "Normal chamber: 4:00 PM–9:00 PM; off Tuesday and Friday. Confirm before travel.", note: "Provider directory lists more than one chamber schedule; appointment line confirmation is required.",
    sourceLabel: "Ibn Sina Trust · medicine directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686",
  },
  {
    kind: "doctor", name: "Assist. Prof. Dr. Umme Habiba Jyoti", specialty: "Medicine Specialist",
    conditions: ["fever", "cough", "cold", "general medicine", "internal medicine", "medicine"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 813", phone: "09610-009636",
    availability: "Normal chamber: 4:00 PM–8:00 PM; off Friday. Confirm before travel.", note: "Provider directory lists the appointment line and normal chamber schedule; schedules can change.",
    sourceLabel: "Ibn Sina Trust · medicine directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686",
  },
  {
    kind: "doctor", name: "Dr. Abdur Razzaque", specialty: "Medicine Specialist",
    conditions: ["fever", "cough", "cold", "general medicine", "internal medicine", "medicine"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 6, Room 616", phone: "09610-009636",
    availability: "Normal chamber: 3:00 PM–8:00 PM on Monday. Confirm before travel.", note: "Provider directory lists the appointment line and normal chamber schedule; schedules can change.",
    sourceLabel: "Ibn Sina Trust · medicine directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686",
  },
  {
    kind: "doctor", name: "Assist. Prof. Dr. Md. Atik Mahmud", specialty: "Medicine Specialist",
    conditions: ["fever", "cough", "cold", "general medicine", "internal medicine", "medicine"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 814", phone: "09610-009636",
    availability: "Normal chamber: 3:00 PM–6:00 PM on Saturday, Monday, Tuesday and Thursday. Confirm before travel.", note: "Provider directory lists the appointment line and normal chamber schedule; schedules can change.",
    sourceLabel: "Ibn Sina Trust · medicine directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686",
  },
  {
    kind: "doctor", name: "Dr. Shuvo Kumar Das", specialty: "Cardiovascular & thoracic surgery",
    conditions: ["heart", "cardiology", "cardiac", "cardiovascular", "chest surgery"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 810", phone: "09610-009636",
    availability: "Normal chamber: 3:00 PM–6:00 PM; off Tuesday and Friday. Confirm before travel.", note: "Provider directory lists the appointment line and normal chamber schedule; schedules can change.",
    sourceLabel: "Ibn Sina Trust · cardiology directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=688",
  },
  {
    kind: "doctor", name: "Dr. Syeda Momena Hossain (Nishi)", specialty: "General Surgery Specialist",
    conditions: ["surgery", "general surgery", "laparoscopic", "abdomen", "gallbladder"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 4, Room 405", phone: "09610-009636",
    availability: "Normal chamber: 6:00 PM–7:00 PM; off Monday and Friday. Confirm before travel.", note: "Provider directory lists the appointment line and normal chamber schedule; schedules can change.",
    sourceLabel: "Ibn Sina Trust · general surgery directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=705",
  },
  {
    kind: "doctor", name: "Dr. Ali Zaman", specialty: "General Surgery and Laparoscopic",
    conditions: ["surgery", "general surgery", "laparoscopic", "abdomen", "gallbladder"],
    address: "Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 5, Room 811", phone: "09610-009636",
    availability: "Normal chamber: 3:00 PM–6:00 PM on Saturday, Tuesday and Thursday. Confirm before travel.", note: "Provider directory lists the appointment line and normal chamber schedule; schedules can change.",
    sourceLabel: "Ibn Sina Trust · general surgery directory", sourceUrl: "https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=705",
  },
  {
    kind: "blood_bank", name: "Rajshahi Red Crescent Blood Center", specialty: "Blood donation and transfusion support",
    conditions: ["blood", "blood bank", "donor", "transfusion", "emergency blood"],
    address: "Rajshahi District Road, Rajshahi", phone: "01865-055075, 01556-333821", availability: "Call before travelling; stock and eligibility change quickly.",
    note: "Confirm blood-group availability and hospital requirements by phone.", sourceLabel: "Bangladesh Red Crescent Blood Center · official contact",
    sourceUrl: "https://www.bdrcs-bloodcenter.com/contact",
  },
  {
    kind: "blood_bank", name: "Christian Mission Hospital Rajshahi · Blood Bank", specialty: "Blood support",
    conditions: ["blood", "blood bank", "donor", "transfusion"],
    address: "Christian Mission Hospital, Sreerampur, Rajshahi", phone: "01733-845247", availability: "Emergency support listed 24/7; call to confirm current availability.",
    note: "The hospital publishes blood-group status, but it can change quickly.", sourceLabel: "Christian Mission Hospital Rajshahi · official blood bank",
    sourceUrl: "https://cmhrajshahi.org/blood-bank",
  },
  {
    kind: "blood_bank", name: "Rajshahi Blood Bank and Transfusion Centre", specialty: "Blood bank and transfusion",
    conditions: ["blood", "blood bank", "transfusion"],
    address: "Rajpara, Rajshahi City Corporation, Rajshahi", email: "babulhossain101@gmail.com", availability: "Contact details require confirmation before travel.",
    note: "Registered in the Government facility registry. A current direct phone number has not been claimed as official in this directory.",
    sourceLabel: "DGHS Facility Registry", sourceUrl: "https://hrm.dghs.gov.bd/public/facility-registry/reports/organization-list?alias_columns_csv=id%2Cname%2Cname_bn%2Ccode%2Cemail_1%2Cfacility_agency_name%2Cfacility_type_name%2Cdivision_name%2Cdistrict_name%2Ccity_corporation_name%2Cupazila_name%2Cpaurasava_name%2Cunion_name%2Cis_private&columns_csv=id%2Cname%2Cname_bn%2Ccode%2Cemail_1%2Cfacility_agency_name%2Cfacility_type_name%2Cdivision_name%2Cdistrict_name%2Ccity_corporation_name%2Cupazila_name%2Cpaurasava_name%2Cunion_name%2Cis_private&is_active=1&page=662&submit=Run",
  },
];

const getOrCreateCategory = async (pool, category) => {
  const request = pool.request();
  request.input("name", sql.NVarChar(120), category.name);
  const existing = await request.query("SELECT Id FROM dbo.Categories WHERE Name = @name");
  request.input("description", sql.NVarChar(1000), category.description);
  request.input("icon", sql.NVarChar(20), category.icon);
  request.input("sortOrder", sql.Int, category.sortOrder);
  if (existing.recordset[0]) {
    request.input("id", sql.UniqueIdentifier, existing.recordset[0].Id);
    await request.query("UPDATE dbo.Categories SET Description = @description, Icon = @icon, SortOrder = @sortOrder, IsFeatured = 1, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id");
    return existing.recordset[0].Id;
  }
  const inserted = await request.query("INSERT INTO dbo.Categories (Name, Description, Icon, SortOrder, IsFeatured) OUTPUT inserted.Id VALUES (@name, @description, @icon, @sortOrder, 1)");
  return inserted.recordset[0].Id;
};

const getOrCreateSubcategory = async (pool, categoryId, [name, description, icon], sortOrder) => {
  const request = pool.request();
  request.input("categoryId", sql.UniqueIdentifier, categoryId);
  request.input("name", sql.NVarChar(120), name);
  const existing = await request.query("SELECT Id FROM dbo.Subcategories WHERE CategoryId = @categoryId AND Name = @name");
  request.input("description", sql.NVarChar(500), description);
  request.input("icon", sql.NVarChar(20), icon);
  request.input("sortOrder", sql.Int, sortOrder);
  if (existing.recordset[0]) {
    request.input("id", sql.UniqueIdentifier, existing.recordset[0].Id);
    await request.query("UPDATE dbo.Subcategories SET Description = @description, Icon = @icon, SortOrder = @sortOrder, IsActive = 1, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id");
    return existing.recordset[0].Id;
  }
  const inserted = await request.query(`INSERT INTO dbo.Subcategories (CategoryId, Name, Description, Icon, SortOrder)
    OUTPUT inserted.Id VALUES (@categoryId, @name, @description, @icon, @sortOrder)`);
  return inserted.recordset[0].Id;
};

try {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error("Refusing to seed production. Set ALLOW_PRODUCTION_SEED=true only for an intentional initial catalogue import.");
  }
  const skipAdmin = process.env.SKIP_ADMIN_SEED === "true";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!skipAdmin && (!adminEmail || !adminPassword || adminEmail === "owner@example.com" || adminPassword.length < 12)) {
    throw new Error("Set a real ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before seeding.");
  }
  const pool = await connectDB();
  const categoryIds = new Map();
  const subcategoryIds = new Map();
  for (const category of categories) {
    const categoryId = await getOrCreateCategory(pool, category);
    categoryIds.set(category.name, categoryId);
    for (const [index, subcategory] of category.subcategories.entries()) {
      const subcategoryId = await getOrCreateSubcategory(pool, categoryId, subcategory, index + 1);
      subcategoryIds.set(`${category.name}::${subcategory[0]}`, subcategoryId);
    }
  }

  if (!skipAdmin) {
    const accountRequest = pool.request();
    accountRequest.input("email", sql.NVarChar(254), adminEmail);
    const existingAdmin = await accountRequest.query("SELECT Id FROM dbo.Users WHERE Email = @email");
    accountRequest.input("name", sql.NVarChar(120), process.env.ADMIN_NAME || "Aurevia Care Owner");
    accountRequest.input("passwordHash", sql.NVarChar(255), await bcrypt.hash(adminPassword, 12));
    if (!existingAdmin.recordset[0]) {
      await accountRequest.query("INSERT INTO dbo.Users (Name, Email, PasswordHash, Role) VALUES (@name, @email, @passwordHash, 'admin')");
    } else {
      // Keep the explicitly configured production administrator usable after
      // a password rotation, and elevate an existing matching account safely.
      accountRequest.input("id", sql.UniqueIdentifier, existingAdmin.recordset[0].Id);
      await accountRequest.query("UPDATE dbo.Users SET Name = @name, PasswordHash = @passwordHash, Role = 'admin', IsActive = 1, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id");
    }
  }

  for (const product of products) {
    const request = pool.request();
    request.input("name", sql.NVarChar(180), product.name);
    const existing = await request.query("SELECT Id FROM dbo.Products WHERE Name = @name");
    request.input("categoryId", sql.UniqueIdentifier, categoryIds.get(product.category));
    request.input("subcategoryId", sql.UniqueIdentifier, subcategoryIds.get(`${product.category}::${product.subcategory}`));
    request.input("brand", sql.NVarChar(120), product.brand);
    request.input("description", sql.NVarChar(sql.MAX), product.description);
    request.input("symptoms", sql.NVarChar(sql.MAX), JSON.stringify(product.symptoms));
    request.input("price", sql.Decimal(12, 2), product.price);
    request.input("stock", sql.Int, product.stock);
    request.input("threshold", sql.Int, product.threshold);
    request.input("image", sql.NVarChar(2048), product.image);
    request.input("rx", sql.Bit, product.rx);
    if (existing.recordset[0]) {
      request.input("id", sql.UniqueIdentifier, existing.recordset[0].Id);
      await request.query(`UPDATE dbo.Products SET CategoryId = @categoryId, SubcategoryId = @subcategoryId,
        Symptoms = @symptoms, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id`);
      continue;
    }
    await request.query(`INSERT INTO dbo.Products (CategoryId, SubcategoryId, Name, Brand, Description, Symptoms, Price, Stock,
      LowStockThreshold, ImageUrl, RequiresPrescription, IsVerified) VALUES (@categoryId, @subcategoryId, @name, @brand,
      @description, @symptoms, @price, @stock, @threshold, @image, @rx, 0)`);
  }

  for (const entry of careDirectory) {
    const request = pool.request();
    request.input("name", sql.NVarChar(180), entry.name);
    request.input("kind", sql.VarChar(24), entry.kind);
    const existing = await request.query("SELECT Id FROM dbo.CareDirectoryEntries WHERE Name = @name AND Kind = @kind");
    if (existing.recordset[0]) continue;
    request.input("specialty", sql.NVarChar(180), entry.specialty || null);
    request.input("conditions", sql.NVarChar(sql.MAX), JSON.stringify(entry.conditions || []));
    request.input("address", sql.NVarChar(600), entry.address);
    request.input("phone", sql.NVarChar(200), entry.phone || null);
    request.input("email", sql.NVarChar(254), entry.email || null);
    request.input("availability", sql.NVarChar(300), entry.availability || null);
    request.input("note", sql.NVarChar(500), entry.note || null);
    request.input("sourceLabel", sql.NVarChar(180), entry.sourceLabel);
    request.input("sourceUrl", sql.NVarChar(2048), entry.sourceUrl);
    request.input("verified", sql.Date, "2026-09-22");
    request.input("division", sql.NVarChar(80), entry.division || "Rajshahi");
    request.input("district", sql.NVarChar(80), entry.district || "Rajshahi");
    request.input("upazila", sql.NVarChar(120), entry.upazila || "Rajshahi City");
    request.input("country", sql.NVarChar(80), entry.country || "Bangladesh");
    await request.query(`INSERT INTO dbo.CareDirectoryEntries
      (Kind, Name, Specialty, ConditionsJson, Address, Phone, Email, Availability, VerificationNote, SourceLabel, SourceUrl, LastVerifiedAt, Division, District, Upazila, Country)
      VALUES (@kind, @name, @specialty, @conditions, @address, @phone, @email, @availability, @note, @sourceLabel, @sourceUrl, @verified, @division, @district, @upazila, @country)`);
  }
  await pool.close();
  console.log("Aurevia Care bootstrap catalogue and Rajshahi care directory imported.");
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
}
