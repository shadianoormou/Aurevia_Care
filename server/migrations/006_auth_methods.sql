SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.Users', 'GoogleSubject') IS NULL
  EXEC(N'ALTER TABLE dbo.Users ADD GoogleSubject NVARCHAR(255) NULL');

-- Email is optional for phone/password accounts. Filtered indexes preserve uniqueness
-- without blocking multiple phone-only users on a NULL email value.
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_Users_Email' AND parent_object_id = OBJECT_ID('dbo.Users'))
  ALTER TABLE dbo.Users DROP CONSTRAINT UQ_Users_Email;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'Email' AND is_nullable = 0)
  EXEC(N'ALTER TABLE dbo.Users ALTER COLUMN Email NVARCHAR(254) NULL');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
  EXEC(N'CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email) WHERE Email IS NOT NULL');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Phone' AND object_id = OBJECT_ID('dbo.Users'))
  EXEC(N'CREATE UNIQUE INDEX UX_Users_Phone ON dbo.Users(Phone) WHERE Phone IS NOT NULL');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_GoogleSubject' AND object_id = OBJECT_ID('dbo.Users'))
  EXEC(N'CREATE UNIQUE INDEX UX_Users_GoogleSubject ON dbo.Users(GoogleSubject) WHERE GoogleSubject IS NOT NULL');

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_AuthIdentity' AND parent_object_id = OBJECT_ID('dbo.Users'))
  EXEC(N'ALTER TABLE dbo.Users ADD CONSTRAINT CK_Users_AuthIdentity CHECK (Email IS NOT NULL OR Phone IS NOT NULL OR GoogleSubject IS NOT NULL)');

COMMIT TRANSACTION;
