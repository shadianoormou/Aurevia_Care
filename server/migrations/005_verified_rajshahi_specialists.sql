-- Source-attributed specialist records from the Ibn Sina Trust Rajshahi directory.
-- This migration is idempotent and keeps production in sync without running the dev seed.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @verified DATE = CONVERT(date, '2026-09-23');

INSERT INTO dbo.CareDirectoryEntries
  (Kind, Name, Specialty, ConditionsJson, Address, Phone, Availability, VerificationNote, SourceLabel, SourceUrl, LastVerifiedAt, IsPublished, Division, District, Upazila, Country)
SELECT v.Kind, v.Name, v.Specialty, v.ConditionsJson, v.Address, v.Phone, v.Availability, v.VerificationNote, v.SourceLabel, v.SourceUrl, @verified, 1, N'Rajshahi', N'Rajshahi', N'Rajshahi City', N'Bangladesh'
FROM (VALUES
  ('doctor', N'Asso Prof. Dr. Md. Nurul Islam', N'Medicine Specialist', N'["fever","cough","cold","general medicine","internal medicine","medicine"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 804', N'09610-009636', N'Normal chamber: 4:00 PM–9:00 PM; off Tuesday and Friday. Confirm before travel.', N'Provider directory lists more than one chamber schedule; appointment line confirmation is required.', N'Ibn Sina Trust · medicine directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686'),
  ('doctor', N'Assist. Prof. Dr. Umme Habiba Jyoti', N'Medicine Specialist', N'["fever","cough","cold","general medicine","internal medicine","medicine"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 813', N'09610-009636', N'Normal chamber: 4:00 PM–8:00 PM; off Friday. Confirm before travel.', N'Provider directory lists the appointment line and normal chamber schedule; schedules can change.', N'Ibn Sina Trust · medicine directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686'),
  ('doctor', N'Dr. Abdur Razzaque', N'Medicine Specialist', N'["fever","cough","cold","general medicine","internal medicine","medicine"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 6, Room 616', N'09610-009636', N'Normal chamber: 3:00 PM–8:00 PM on Monday. Confirm before travel.', N'Provider directory lists the appointment line and normal chamber schedule; schedules can change.', N'Ibn Sina Trust · medicine directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686'),
  ('doctor', N'Assist. Prof. Dr. Md. Atik Mahmud', N'Medicine Specialist', N'["fever","cough","cold","general medicine","internal medicine","medicine"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 814', N'09610-009636', N'Normal chamber: 3:00 PM–6:00 PM on Saturday, Monday, Tuesday and Thursday. Confirm before travel.', N'Provider directory lists the appointment line and normal chamber schedule; schedules can change.', N'Ibn Sina Trust · medicine directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=686'),
  ('doctor', N'Dr. Shuvo Kumar Das', N'Cardiovascular & thoracic surgery', N'["heart","cardiology","cardiac","cardiovascular","chest surgery"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 8, Room 810', N'09610-009636', N'Normal chamber: 3:00 PM–6:00 PM; off Tuesday and Friday. Confirm before travel.', N'Provider directory lists the appointment line and normal chamber schedule; schedules can change.', N'Ibn Sina Trust · cardiology directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=688'),
  ('doctor', N'Dr. Syeda Momena Hossain (Nishi)', N'General Surgery Specialist', N'["surgery","general surgery","laparoscopic","abdomen","gallbladder"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 4, Room 405', N'09610-009636', N'Normal chamber: 6:00 PM–7:00 PM; off Monday and Friday. Confirm before travel.', N'Provider directory lists the appointment line and normal chamber schedule; schedules can change.', N'Ibn Sina Trust · general surgery directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=705'),
  ('doctor', N'Dr. Ali Zaman', N'General Surgery and Laparoscopic', N'["surgery","general surgery","laparoscopic","abdomen","gallbladder"]', N'Ibn Sina Diagnostic & Consultation Center, Rajshahi · Level 5, Room 811', N'09610-009636', N'Normal chamber: 3:00 PM–6:00 PM on Saturday, Tuesday and Thursday. Confirm before travel.', N'Provider directory lists the appointment line and normal chamber schedule; schedules can change.', N'Ibn Sina Trust · general surgery directory', N'https://ibnsinatrust.com/view_departmentwiseDoctor.php?id=705')
) AS v(Kind, Name, Specialty, ConditionsJson, Address, Phone, Availability, VerificationNote, SourceLabel, SourceUrl)
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.CareDirectoryEntries existing
  WHERE existing.Name = v.Name AND existing.Kind = v.Kind
);

COMMIT TRANSACTION;
