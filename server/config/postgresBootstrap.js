// Idempotent hosted bootstrap data. This keeps a fresh Neon database useful
// even when a platform build skips an optional seed command.
export const POSTGRES_BOOTSTRAP = String.raw`
INSERT INTO dbo.categories (name, description, icon, sortorder, isfeatured)
VALUES
 ('Medicines & Wellness','OTC essentials, symptom-led care, vitamins and prescription fulfilment','💊',1,TRUE),
 ('Skin Care','Thoughtful daily skincare and dermatologist-aware essentials','✦',2,TRUE),
 ('Hair & Scalp','Everyday hair, scalp and anti-dandruff care','〰',3,TRUE),
 ('Oral & Dental','Tooth, gum and fresh-breath care','◡',4,TRUE),
 ('Creams & First Aid','Pharmaceutical creams, gels and practical first-aid care','✚',5,TRUE)
ON CONFLICT (name) DO UPDATE SET isfeatured=TRUE, updatedat=CURRENT_TIMESTAMP;

INSERT INTO dbo.subcategories (categoryid, name, description, icon, sortorder)
SELECT c.id, v.name, v.description, v.icon, v.sortorder
FROM dbo.categories c
JOIN (VALUES
 ('Medicines & Wellness','Headache & Pain','Headache, body-pain and recovery essentials','◌',1),
 ('Medicines & Wellness','Cold, Cough & Allergy','Seasonal respiratory comfort','◌',2),
 ('Medicines & Wellness','Vitamins & Wellness','Daily nutrition and wellbeing','◌',3),
 ('Medicines & Wellness','Prescription & Chronic Care','Pharmacist-reviewed prescription fulfilment','◌',4),
 ('Skin Care','Cleansers & Acne Care','Gentle cleansing and blemish-prone skin care','◌',1),
 ('Skin Care','Moisturisers & Barrier Care','Hydration and barrier support','◌',2),
 ('Skin Care','Sun Protection','Daily UV protection','◌',3),
 ('Hair & Scalp','Daily Shampoo','Cleansing for everyday routines','◌',1),
 ('Hair & Scalp','Anti-Dandruff','Scalp-focused cleansing','◌',2),
 ('Oral & Dental','Toothpaste','Daily fluoride toothpaste','◌',1),
 ('Oral & Dental','Sensitive Teeth','Comfort-focused oral care','◌',2),
 ('Oral & Dental','Mouthwash','Fresh-breath routines','◌',3),
 ('Creams & First Aid','Antiseptic & Wound Care','Minor-cut and superficial-care essentials','◌',1),
 ('Creams & First Aid','Pain Relief Gels','Topical comfort products','◌',2),
 ('Creams & First Aid','Protective Creams','Hands, body and dry-skin protection','◌',3)
 ) AS v(categoryname,name,description,icon,sortorder) ON c.name=v.categoryname
WHERE NOT EXISTS (SELECT 1 FROM dbo.subcategories s WHERE s.categoryid=c.id AND s.name=v.name);

INSERT INTO dbo.products (categoryid, subcategoryid, name, brand, description, symptoms, price, stock, lowstockthreshold, imageurl, requiresprescription, isverified)
SELECT c.id, s.id, v.name, v.brand, v.description, v.symptoms, v.price, v.stock, v.threshold, v.imageurl, v.rx, TRUE
FROM (VALUES
 ('Medicines & Wellness','Headache & Pain','Paracetamol 500mg · 10 tablets','Aurevia Essentials','Temporary relief of fever, headache and minor aches. Follow the label directions.','["fever","headache","body pain"]',30,150,20,'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900',FALSE),
 ('Medicines & Wellness','Headache & Pain','Ibuprofen 400mg · 10 tablets','Aurevia Essentials','Anti-inflammatory pain relief. Ask a pharmacist about stomach, kidney or heart concerns.','["headache","body pain"]',45,40,15,'https://images.unsplash.com/photo-1550572017-edd951b55104?w=900',FALSE),
 ('Medicines & Wellness','Cold, Cough & Allergy','Cough Comfort Syrup · 100ml','CalmTuss','Soothing relief for occasional cough and throat irritation.','["cough","sore throat"]',80,60,10,'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900',FALSE),
 ('Medicines & Wellness','Vitamins & Wellness','Daily Multivitamin · 30 tablets','VitaBoost','Daily multivitamin formulated to support everyday nutrition.','["vitamin","wellness"]',120,75,15,'https://images.unsplash.com/photo-1550572017-edd951b55104?w=900',FALSE),
 ('Medicines & Wellness','Prescription & Chronic Care','Metformin 500mg · 30 tablets','Aurevia Rx','Prescription-only medicine. Pharmacist verification is required before fulfilment.','["diabetes"]',150,40,10,'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900',TRUE),
 ('Skin Care','Cleansers & Acne Care','Hydra Balance Face Cleanser · 100ml','Aurevia Skin','A gentle everyday cleanser for a simple skin-care routine.','["skin care","cleanser"]',380,45,10,'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=900',FALSE),
 ('Skin Care','Sun Protection','Daily Mineral Sunscreen SPF 50 · 50ml','Aurevia Skin','Daily broad-spectrum sun protection. Reapply according to the label.','["sun care","skin care"]',690,38,8,'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=900',FALSE),
 ('Hair & Scalp','Anti-Dandruff','Scalp Balance Anti-Dandruff Shampoo · 180ml','Aurevia Hair','Scalp-focused cleansing for an everyday anti-dandruff routine.','["dandruff","scalp"]',420,36,10,'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900',FALSE),
 ('Oral & Dental','Sensitive Teeth','Sensitive Teeth Toothpaste · 75g','Aurevia Oral','Sensitivity-focused toothpaste for routine care. See a dentist for persistent pain.','["sensitive teeth","oral care"]',260,48,10,'https://images.unsplash.com/photo-1559591937-abc7f8a9c700?w=900',FALSE),
 ('Creams & First Aid','Pain Relief Gels','Cooling Muscle Comfort Gel · 30g','Aurevia First Aid','Topical comfort gel. Read the label and consult a pharmacist if unsure.','["body pain","muscle"]',210,44,10,'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900',FALSE)
 ) AS v(categoryname,subcategoryname,name,brand,description,symptoms,price,stock,threshold,imageurl,rx)
JOIN dbo.categories c ON c.name=v.categoryname
JOIN dbo.subcategories s ON s.categoryid=c.id AND s.name=v.subcategoryname
WHERE NOT EXISTS (SELECT 1 FROM dbo.products p WHERE p.name=v.name);

INSERT INTO dbo.caredirectoryentries (kind,name,specialty,conditionsjson,address,phone,availability,verificationnote,sourcelabel,sourceurl,lastverifiedat,division,district,upazila,country)
VALUES
 ('emergency','Rajshahi Medical College Hospital · Emergency','Emergency care','["emergency","chest pain","breathing difficulty","injury"]','Laxmipur, Rajshahi 6000, Bangladesh','01321-180514','24/7 emergency line','For ambulance: 01321-180516. Call 999 for national emergency support.','Rajshahi Medical College Hospital · official contact','https://rmch.gov.bd/contact-us/','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('facility','Rajshahi Medical College Hospital · Helpdesk & OPD','General medicine and specialist referral','["fever","headache","cough","general medicine","opd"]','Laxmipur, Rajshahi 6000, Bangladesh','01958-509495','Confirm current hours by phone','Government facility record and official hospital contact.','RMCH official contact','https://rmch.gov.bd/contact-us/','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('diagnostic','Ibn Sina Diagnostic & Consultation Center, Rajshahi','Diagnostic tests and specialist consultation','["diagnostic","lab","test","consultation"]','Kazihata, Rajpara, Rajshahi','09610-009636','Call to confirm doctor serial and test availability','Official branch contact.','Ibn Sina Trust · Rajshahi contact','https://ibnsinatrust.com/contact.php','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('doctor','Dr. Md. Munzur Rahman (Shimul)','Orthopedics and trauma surgery','["bone","joint","fracture","orthopedic","leg pain","back pain"]','Ibn Sina Diagnostic & Consultation Center, Rajshahi','09610-009636','Call to confirm chamber time','Directory schedules can change; confirm before travel.','Ibn Sina Trust · doctor directory','https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=689','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('doctor','Dr. Isratunnahar Shimu','Dental surgery','["dental","tooth","gum","toothache"]','Ibn Sina Diagnostic & Consultation Center, Rajshahi','09610-009636','Call to confirm chamber time','Directory schedules can change; confirm before travel.','Ibn Sina Trust · doctor directory','https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=367','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('doctor','Dr. Shish Mohammad Sarkar','Chest, respiratory medicine and asthma','["cough","asthma","chest","respiratory","breathing"]','Ibn Sina Diagnostic & Consultation Center, Rajshahi','09610-009636','Call to confirm chamber time','Directory schedules can change; confirm before travel.','Ibn Sina Trust · doctor directory','https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=350','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('doctor','Dr. AKM Rezwanul Islam (Maruf)','Cardiology','["heart","cardiology","palpitation","blood pressure"]','Ibn Sina Diagnostic & Consultation Center, Rajshahi','09610-009636','Call to confirm chamber time','Use this route for heart-specific symptoms; call before visiting.','Ibn Sina Trust · doctor directory','https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=637','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh'),
 ('blood_bank','Rajshahi Red Crescent Blood Center','Blood donation and transfusion support','["blood","blood bank","donor","transfusion"]','Rajshahi District Road, Rajshahi','01865-055075, 01556-333821','Call before travelling; stock changes quickly','Confirm blood-group availability and hospital requirements.','Bangladesh Red Crescent Blood Center · official contact','https://www.bdrcs-bloodcenter.com/contact','2026-09-22','Rajshahi','Rajshahi','Rajshahi City','Bangladesh')
ON CONFLICT (name,kind) DO NOTHING;
`;
