SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users')
BEGIN
  CREATE TABLE dbo.Users (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Users PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(120) NOT NULL, Email NVARCHAR(254) NOT NULL, PasswordHash NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(30) NULL, AddressStreet NVARCHAR(240) NULL, AddressCity NVARCHAR(120) NULL,
    AddressState NVARCHAR(120) NULL, AddressZipCode NVARCHAR(30) NULL, AddressCountry NVARCHAR(120) NULL,
    Role VARCHAR(20) NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'customer',
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CK_Users_Role CHECK (Role IN ('customer', 'admin', 'pharmacist'))
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Categories')
BEGIN
  CREATE TABLE dbo.Categories (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Categories PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(120) NOT NULL, Description NVARCHAR(1000) NULL, Icon NVARCHAR(20) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Categories_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Categories_Name UNIQUE (Name)
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Products')
BEGIN
  CREATE TABLE dbo.Products (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Products PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    CategoryId UNIQUEIDENTIFIER NOT NULL, Name NVARCHAR(180) NOT NULL, Brand NVARCHAR(120) NULL,
    Description NVARCHAR(MAX) NOT NULL, Symptoms NVARCHAR(MAX) NULL, Price DECIMAL(12,2) NOT NULL,
    Stock INT NOT NULL CONSTRAINT DF_Products_Stock DEFAULT 0,
    LowStockThreshold INT NOT NULL CONSTRAINT DF_Products_LowStock DEFAULT 10,
    ImageUrl NVARCHAR(2048) NULL, ImagePublicId NVARCHAR(255) NULL,
    RequiresPrescription BIT NOT NULL CONSTRAINT DF_Products_RequiresPrescription DEFAULT 0,
    Rating DECIMAL(3,2) NOT NULL CONSTRAINT DF_Products_Rating DEFAULT 0,
    NumReviews INT NOT NULL CONSTRAINT DF_Products_NumReviews DEFAULT 0,
    IsVerified BIT NOT NULL CONSTRAINT DF_Products_IsVerified DEFAULT 0,
    VerifiedBy UNIQUEIDENTIFIER NULL, VerifiedAt DATETIME2 NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id),
    CONSTRAINT FK_Products_VerifiedBy FOREIGN KEY (VerifiedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT CK_Products_Price CHECK (Price >= 0), CONSTRAINT CK_Products_Stock CHECK (Stock >= 0),
    CONSTRAINT CK_Products_LowStock CHECK (LowStockThreshold >= 0)
  );
  CREATE INDEX IX_Products_Category_Active ON dbo.Products(CategoryId, IsActive);
  CREATE INDEX IX_Products_Search ON dbo.Products(IsActive, CreatedAt DESC);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Reviews')
BEGIN
  CREATE TABLE dbo.Reviews (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Reviews PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    ProductId UNIQUEIDENTIFIER NOT NULL, UserId UNIQUEIDENTIFIER NOT NULL, Name NVARCHAR(120) NOT NULL,
    Rating TINYINT NOT NULL, Comment NVARCHAR(2000) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Reviews_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Reviews_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Reviews_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT FK_Reviews_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT UQ_Reviews_Product_User UNIQUE (ProductId, UserId),
    CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Prescriptions')
BEGIN
  CREATE TABLE dbo.Prescriptions (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Prescriptions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId UNIQUEIDENTIFIER NOT NULL, Mode VARCHAR(12) NOT NULL,
    Status VARCHAR(12) NOT NULL CONSTRAINT DF_Prescriptions_Status DEFAULT 'Pending',
    DoctorName NVARCHAR(160) NULL, DoctorRegistration NVARCHAR(100) NULL,
    PrescriptionNumber NVARCHAR(100) NULL, MedicationDetails NVARCHAR(MAX) NULL, Note NVARCHAR(2000) NULL,
    FileName NVARCHAR(255) NULL, FileMimeType NVARCHAR(100) NULL, FileSize INT NULL, FileData VARBINARY(MAX) NULL,
    ScanText NVARCHAR(MAX) NULL, RejectionReason NVARCHAR(1000) NULL, VerifiedBy UNIQUEIDENTIFIER NULL,
    VerifiedAt DATETIME2 NULL, ExpiresAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Prescriptions_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Prescriptions_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Prescriptions_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Prescriptions_VerifiedBy FOREIGN KEY (VerifiedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT CK_Prescriptions_Mode CHECK (Mode IN ('scan', 'manual')),
    CONSTRAINT CK_Prescriptions_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Expired'))
  );
  CREATE INDEX IX_Prescriptions_User_Status ON dbo.Prescriptions(UserId, Status, CreatedAt DESC);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Orders')
BEGIN
  CREATE TABLE dbo.Orders (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Orders PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId UNIQUEIDENTIFIER NOT NULL, PrescriptionId UNIQUEIDENTIFIER NULL,
    ShippingFullName NVARCHAR(120) NOT NULL, ShippingPhone NVARCHAR(30) NOT NULL,
    ShippingStreet NVARCHAR(240) NOT NULL, ShippingCity NVARCHAR(120) NOT NULL,
    ShippingState NVARCHAR(120) NULL, ShippingZipCode NVARCHAR(30) NULL, ShippingCountry NVARCHAR(120) NULL,
    PaymentMethod VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_PaymentMethod DEFAULT 'COD',
    IsPaid BIT NOT NULL CONSTRAINT DF_Orders_IsPaid DEFAULT 0, PaidAt DATETIME2 NULL,
    ContainsPrescriptionItems BIT NOT NULL CONSTRAINT DF_Orders_ContainsRx DEFAULT 0,
    PrescriptionAcknowledged BIT NOT NULL CONSTRAINT DF_Orders_RxAcknowledged DEFAULT 0,
    ItemsPrice DECIMAL(12,2) NOT NULL, ShippingPrice DECIMAL(12,2) NOT NULL,
    TaxPrice DECIMAL(12,2) NOT NULL, TotalPrice DECIMAL(12,2) NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT 'Pending',
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Orders_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Orders_Prescription FOREIGN KEY (PrescriptionId) REFERENCES dbo.Prescriptions(Id),
    CONSTRAINT CK_Orders_PaymentMethod CHECK (PaymentMethod IN ('COD', 'Stripe')),
    CONSTRAINT CK_Orders_Status CHECK (Status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'))
  );
  CREATE INDEX IX_Orders_User_CreatedAt ON dbo.Orders(UserId, CreatedAt DESC);
  CREATE INDEX IX_Orders_Status_CreatedAt ON dbo.Orders(Status, CreatedAt DESC);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrderItems')
BEGIN
  CREATE TABLE dbo.OrderItems (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OrderItems PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    OrderId UNIQUEIDENTIFIER NOT NULL, ProductId UNIQUEIDENTIFIER NOT NULL, Name NVARCHAR(180) NOT NULL,
    ImageUrl NVARCHAR(2048) NULL, Price DECIMAL(12,2) NOT NULL, Quantity INT NOT NULL,
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity > 0)
  );
  CREATE INDEX IX_OrderItems_Order ON dbo.OrderItems(OrderId);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrderStatusHistory')
BEGIN
  CREATE TABLE dbo.OrderStatusHistory (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OrderStatusHistory PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    OrderId UNIQUEIDENTIFIER NOT NULL, Status VARCHAR(20) NOT NULL, ChangedBy UNIQUEIDENTIFIER NULL,
    ChangedAt DATETIME2 NOT NULL CONSTRAINT DF_OrderStatusHistory_ChangedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrderStatusHistory_Order FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderStatusHistory_User FOREIGN KEY (ChangedBy) REFERENCES dbo.Users(Id)
  );
  CREATE INDEX IX_OrderStatusHistory_Order ON dbo.OrderStatusHistory(OrderId, ChangedAt ASC);
END;

COMMIT TRANSACTION;
