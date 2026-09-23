SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.CareDirectoryEntries', 'Division') IS NULL
  EXEC(N'ALTER TABLE dbo.CareDirectoryEntries ADD Division NVARCHAR(80) NULL');

IF COL_LENGTH('dbo.CareDirectoryEntries', 'District') IS NULL
  EXEC(N'ALTER TABLE dbo.CareDirectoryEntries ADD District NVARCHAR(80) NULL');

IF COL_LENGTH('dbo.CareDirectoryEntries', 'Upazila') IS NULL
  EXEC(N'ALTER TABLE dbo.CareDirectoryEntries ADD Upazila NVARCHAR(120) NULL');

IF COL_LENGTH('dbo.CareDirectoryEntries', 'Country') IS NULL
  EXEC(N'ALTER TABLE dbo.CareDirectoryEntries ADD Country NVARCHAR(80) NOT NULL CONSTRAINT DF_CareDirectoryEntries_Country DEFAULT ''Bangladesh''');

-- Existing records are intentionally scoped to the only seeded geography.
EXEC(N'UPDATE dbo.CareDirectoryEntries
SET Division = COALESCE(Division, ''Rajshahi''),
    District = COALESCE(District, ''Rajshahi''),
    Upazila = COALESCE(Upazila, ''Rajshahi City'')
WHERE Division IS NULL OR District IS NULL OR Upazila IS NULL');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CareDirectoryEntries_Geography' AND object_id = OBJECT_ID('dbo.CareDirectoryEntries'))
  EXEC(N'CREATE INDEX IX_CareDirectoryEntries_Geography
    ON dbo.CareDirectoryEntries (IsPublished, Division, District, Upazila, Kind, LastVerifiedAt DESC)');

COMMIT TRANSACTION;
