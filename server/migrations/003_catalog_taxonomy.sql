SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.Categories', 'SortOrder') IS NULL
  ALTER TABLE dbo.Categories ADD SortOrder INT NOT NULL CONSTRAINT DF_Categories_SortOrder DEFAULT 999;

IF COL_LENGTH('dbo.Categories', 'IsFeatured') IS NULL
  ALTER TABLE dbo.Categories ADD IsFeatured BIT NOT NULL CONSTRAINT DF_Categories_IsFeatured DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Subcategories')
BEGIN
  CREATE TABLE dbo.Subcategories (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Subcategories PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    CategoryId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(120) NOT NULL,
    Description NVARCHAR(500) NULL,
    Icon NVARCHAR(20) NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_Subcategories_SortOrder DEFAULT 999,
    IsActive BIT NOT NULL CONSTRAINT DF_Subcategories_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Subcategories_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Subcategories_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Subcategories_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id),
    CONSTRAINT UQ_Subcategories_Category_Name UNIQUE (CategoryId, Name)
  );
  CREATE INDEX IX_Subcategories_Category_Active ON dbo.Subcategories(CategoryId, IsActive, SortOrder);
END;

IF COL_LENGTH('dbo.Products', 'SubcategoryId') IS NULL
  ALTER TABLE dbo.Products ADD SubcategoryId UNIQUEIDENTIFIER NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Products_Subcategory')
  ALTER TABLE dbo.Products ADD CONSTRAINT FK_Products_Subcategory FOREIGN KEY (SubcategoryId) REFERENCES dbo.Subcategories(Id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_Subcategory_Active' AND object_id = OBJECT_ID('dbo.Products'))
  CREATE INDEX IX_Products_Subcategory_Active ON dbo.Products(SubcategoryId, IsActive);

COMMIT TRANSACTION;
