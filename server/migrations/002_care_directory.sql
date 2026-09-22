SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CareDirectoryEntries')
BEGIN
  CREATE TABLE dbo.CareDirectoryEntries (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CareDirectoryEntries PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Kind VARCHAR(24) NOT NULL,
    Name NVARCHAR(180) NOT NULL,
    Specialty NVARCHAR(180) NULL,
    ConditionsJson NVARCHAR(MAX) NULL,
    Address NVARCHAR(600) NOT NULL,
    Phone NVARCHAR(200) NULL,
    Email NVARCHAR(254) NULL,
    Availability NVARCHAR(300) NULL,
    VerificationNote NVARCHAR(500) NULL,
    SourceLabel NVARCHAR(180) NOT NULL,
    SourceUrl NVARCHAR(2048) NOT NULL,
    LastVerifiedAt DATE NOT NULL,
    IsPublished BIT NOT NULL CONSTRAINT DF_CareDirectoryEntries_IsPublished DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CareDirectoryEntries_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CareDirectoryEntries_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_CareDirectoryEntries_Name_Kind UNIQUE (Name, Kind),
    CONSTRAINT CK_CareDirectoryEntries_Kind CHECK (Kind IN ('doctor', 'facility', 'diagnostic', 'blood_bank', 'emergency'))
  );
  CREATE INDEX IX_CareDirectoryEntries_PublicSearch
    ON dbo.CareDirectoryEntries (IsPublished, Kind, LastVerifiedAt DESC);
END;

COMMIT TRANSACTION;
