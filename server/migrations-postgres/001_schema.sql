CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS dbo;

CREATE TABLE IF NOT EXISTS dbo.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254),
  passwordhash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  addressstreet VARCHAR(240), addresscity VARCHAR(120), addressstate VARCHAR(120),
  addresszipcode VARCHAR(30), addresscountry VARCHAR(120),
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'pharmacist')),
  isactive BOOLEAN NOT NULL DEFAULT TRUE,
  googlesubject VARCHAR(255),
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_users_auth_identity CHECK (email IS NOT NULL OR phone IS NOT NULL OR googlesubject IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON dbo.users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_phone ON dbo.users(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_googlesubject ON dbo.users(googlesubject) WHERE googlesubject IS NOT NULL;

CREATE TABLE IF NOT EXISTS dbo.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(1000), icon VARCHAR(20), sortorder INTEGER NOT NULL DEFAULT 999,
  isfeatured BOOLEAN NOT NULL DEFAULT FALSE,
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dbo.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), categoryid UUID NOT NULL REFERENCES dbo.categories(id),
  name VARCHAR(120) NOT NULL, description VARCHAR(500), icon VARCHAR(20), sortorder INTEGER NOT NULL DEFAULT 999,
  isactive BOOLEAN NOT NULL DEFAULT TRUE,
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_subcategories_category_name UNIQUE (categoryid, name)
);
CREATE INDEX IF NOT EXISTS ix_subcategories_category_active ON dbo.subcategories(categoryid, isactive, sortorder);

CREATE TABLE IF NOT EXISTS dbo.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), categoryid UUID NOT NULL REFERENCES dbo.categories(id), subcategoryid UUID,
  name VARCHAR(180) NOT NULL, brand VARCHAR(120), description TEXT NOT NULL, symptoms TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0), stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  lowstockthreshold INTEGER NOT NULL DEFAULT 10 CHECK (lowstockthreshold >= 0), imageurl VARCHAR(2048), imagepublicid VARCHAR(255),
  requiresprescription BOOLEAN NOT NULL DEFAULT FALSE, rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  numreviews INTEGER NOT NULL DEFAULT 0, isverified BOOLEAN NOT NULL DEFAULT FALSE, verifiedby UUID REFERENCES dbo.users(id),
  verifiedat TIMESTAMPTZ, isactive BOOLEAN NOT NULL DEFAULT TRUE,
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategoryid) REFERENCES dbo.subcategories(id)
);
CREATE INDEX IF NOT EXISTS ix_products_category_active ON dbo.products(categoryid, isactive);
CREATE INDEX IF NOT EXISTS ix_products_subcategory_active ON dbo.products(subcategoryid, isactive);
CREATE INDEX IF NOT EXISTS ix_products_search ON dbo.products(isactive, createdat DESC);

CREATE TABLE IF NOT EXISTS dbo.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), productid UUID NOT NULL REFERENCES dbo.products(id), userid UUID NOT NULL REFERENCES dbo.users(id),
  name VARCHAR(120) NOT NULL, rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5), comment VARCHAR(2000) NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_reviews_product_user UNIQUE (productid, userid)
);

CREATE TABLE IF NOT EXISTS dbo.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), userid UUID NOT NULL REFERENCES dbo.users(id), mode VARCHAR(12) NOT NULL CHECK (mode IN ('scan', 'manual')),
  status VARCHAR(12) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Expired')),
  doctorname VARCHAR(160), doctorregistration VARCHAR(100), prescriptionnumber VARCHAR(100), medicationdetails TEXT, note VARCHAR(2000),
  filename VARCHAR(255), filemimetype VARCHAR(100), filesize INTEGER, filedata BYTEA, scantext TEXT, rejectionreason VARCHAR(1000),
  verifiedby UUID REFERENCES dbo.users(id), verifiedat TIMESTAMPTZ, expiresat TIMESTAMPTZ,
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_prescriptions_user_status ON dbo.prescriptions(userid, status, createdat DESC);

CREATE TABLE IF NOT EXISTS dbo.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), userid UUID NOT NULL REFERENCES dbo.users(id), prescriptionid UUID REFERENCES dbo.prescriptions(id),
  shippingfullname VARCHAR(120) NOT NULL, shippingphone VARCHAR(30) NOT NULL, shippingstreet VARCHAR(240) NOT NULL,
  shippingcity VARCHAR(120) NOT NULL, shippingstate VARCHAR(120), shippingzipcode VARCHAR(30), shippingcountry VARCHAR(120),
  paymentmethod VARCHAR(20) NOT NULL DEFAULT 'COD' CHECK (paymentmethod IN ('COD', 'Stripe')),
  ispaid BOOLEAN NOT NULL DEFAULT FALSE, paidat TIMESTAMPTZ, containsprescriptionitems BOOLEAN NOT NULL DEFAULT FALSE,
  prescriptionacknowledged BOOLEAN NOT NULL DEFAULT FALSE, itemsprice NUMERIC(12,2) NOT NULL, shippingprice NUMERIC(12,2) NOT NULL,
  taxprice NUMERIC(12,2) NOT NULL, totalprice NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_orders_user_createdat ON dbo.orders(userid, createdat DESC);
CREATE INDEX IF NOT EXISTS ix_orders_status_createdat ON dbo.orders(status, createdat DESC);

CREATE TABLE IF NOT EXISTS dbo.orderitems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), orderid UUID NOT NULL REFERENCES dbo.orders(id) ON DELETE CASCADE,
  productid UUID NOT NULL REFERENCES dbo.products(id), name VARCHAR(180) NOT NULL, imageurl VARCHAR(2048), price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS ix_orderitems_order ON dbo.orderitems(orderid);

CREATE TABLE IF NOT EXISTS dbo.orderstatushistory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), orderid UUID NOT NULL REFERENCES dbo.orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, changedby UUID REFERENCES dbo.users(id), changedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_orderstatushistory_order ON dbo.orderstatushistory(orderid, changedat ASC);

CREATE TABLE IF NOT EXISTS dbo.caredirectoryentries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), kind VARCHAR(24) NOT NULL CHECK (kind IN ('doctor', 'facility', 'diagnostic', 'blood_bank', 'emergency')),
  name VARCHAR(180) NOT NULL, specialty VARCHAR(180), conditionsjson TEXT, address VARCHAR(600) NOT NULL, phone VARCHAR(200), email VARCHAR(254),
  availability VARCHAR(300), verificationnote VARCHAR(500), sourcelabel VARCHAR(180) NOT NULL, sourceurl VARCHAR(2048) NOT NULL,
  lastverifiedat DATE NOT NULL, ispublished BOOLEAN NOT NULL DEFAULT TRUE, division VARCHAR(80), district VARCHAR(80), upazila VARCHAR(120), country VARCHAR(80) NOT NULL DEFAULT 'Bangladesh',
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_caredirectoryentries_name_kind UNIQUE (name, kind)
);
CREATE INDEX IF NOT EXISTS ix_caredirectoryentries_publicsearch ON dbo.caredirectoryentries(ispublished, kind, lastverifiedat DESC);
CREATE INDEX IF NOT EXISTS ix_caredirectoryentries_geography ON dbo.caredirectoryentries(ispublished, division, district, upazila, kind, lastverifiedat DESC);

