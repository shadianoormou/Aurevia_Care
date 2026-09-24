import { Pool } from "pg";

// Aurevia's controllers use the mssql request API. This small compatibility
// layer keeps those controllers database-agnostic while the hosted deployment
// runs on Neon PostgreSQL. Local SQL Server development remains supported by
// config/db.js when DATABASE_URL is not set.

const FIELD_CASE = new Map([
  ["id", "Id"], ["name", "Name"], ["email", "Email"], ["passwordhash", "PasswordHash"],
  ["googlesubject", "GoogleSubject"], ["phone", "Phone"], ["addressstreet", "AddressStreet"],
  ["addresscity", "AddressCity"], ["addressstate", "AddressState"], ["addresszipcode", "AddressZipCode"],
  ["addresscountry", "AddressCountry"], ["role", "Role"], ["isactive", "IsActive"],
  ["createdat", "CreatedAt"], ["updatedat", "UpdatedAt"], ["categoryid", "CategoryId"],
  ["subcategoryid", "SubcategoryId"], ["description", "Description"], ["icon", "Icon"],
  ["sortorder", "SortOrder"], ["isfeatured", "IsFeatured"], ["brand", "Brand"],
  ["symptoms", "Symptoms"], ["price", "Price"], ["stock", "Stock"],
  ["lowstockthreshold", "LowStockThreshold"], ["imageurl", "ImageUrl"],
  ["imagepublicid", "ImagePublicId"], ["requiresprescription", "RequiresPrescription"],
  ["rating", "Rating"], ["numreviews", "NumReviews"], ["isverified", "IsVerified"],
  ["verifiedby", "VerifiedBy"], ["verifiedat", "VerifiedAt"], ["productid", "ProductId"],
  ["userid", "UserId"], ["comment", "Comment"], ["mode", "Mode"], ["status", "Status"],
  ["doctorname", "DoctorName"], ["doctorregistration", "DoctorRegistration"],
  ["prescriptionnumber", "PrescriptionNumber"], ["medicationdetails", "MedicationDetails"],
  ["note", "Note"], ["filename", "FileName"], ["filemimetype", "FileMimeType"],
  ["filesize", "FileSize"], ["filedata", "FileData"], ["scantext", "ScanText"],
  ["rejectionreason", "RejectionReason"], ["expiresat", "ExpiresAt"], ["prescriptionid", "PrescriptionId"],
  ["shippingfullname", "ShippingFullName"], ["shippingphone", "ShippingPhone"],
  ["shippingstreet", "ShippingStreet"], ["shippingcity", "ShippingCity"],
  ["shippingstate", "ShippingState"], ["shippingzipcode", "ShippingZipCode"],
  ["shippingcountry", "ShippingCountry"], ["paymentmethod", "PaymentMethod"],
  ["ispaid", "IsPaid"], ["paidat", "PaidAt"], ["containsprescriptionitems", "ContainsPrescriptionItems"],
  ["prescriptionacknowledged", "PrescriptionAcknowledged"], ["itemsprice", "ItemsPrice"],
  ["shippingprice", "ShippingPrice"], ["taxprice", "TaxPrice"], ["totalprice", "TotalPrice"],
  ["orderid", "OrderId"], ["quantity", "Quantity"], ["changedby", "ChangedBy"],
  ["changedat", "ChangedAt"], ["kind", "Kind"], ["specialty", "Specialty"],
  ["conditionsjson", "ConditionsJson"], ["address", "Address"], ["availability", "Availability"],
  ["verificationnote", "VerificationNote"], ["sourcelabel", "SourceLabel"],
  ["sourceurl", "SourceUrl"], ["lastverifiedat", "LastVerifiedAt"], ["ispublished", "IsPublished"],
  ["division", "Division"], ["district", "District"], ["upazila", "Upazila"], ["country", "Country"],
  ["username", "UserName"], ["useremail", "UserEmail"], ["count", "Count"],
  ["totalusers", "TotalUsers"], ["totalproducts", "TotalProducts"], ["totalorders", "TotalOrders"],
  ["totalsales", "TotalSales"], ["saledate", "SaleDate"], ["sales", "Sales"], ["orders", "Orders"],
]);

const normalizeRow = (row) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [FIELD_CASE.get(key.toLowerCase()) || key, value]),
);

export const rewriteSql = (source) => {
  let text = String(source)
    .replace(/\bN'(?=[^']*')/g, "'")
    .replace(/SYSUTCDATETIME\(\)/gi, "CURRENT_TIMESTAMP")
    .replace(/GETUTCDATE\(\)/gi, "CURRENT_TIMESTAMP")
    .replace(/NEWSEQUENTIALID\(\)/gi, "gen_random_uuid()")
    .replace(/NEWID\(\)/gi, "gen_random_uuid()")
    .replace(/WITH\s*\([^)]*UPDLOCK[^)]*\)/gi, "")
    .replace(/CONVERT\(\s*date\s*,\s*([^\)]+)\)/gi, "CAST($1 AS DATE)")
    .replace(/DATEADD\(\s*DAY\s*,\s*(-?\d+)\s*,\s*CAST\(CURRENT_TIMESTAMP\s+AS\s+DATE\)\s*\)/gi, "(CURRENT_DATE + INTERVAL '$1 day')")
    .replace(/DATEADD\(\s*DAY\s*,\s*(-?\d+)\s*,\s*CURRENT_TIMESTAMP\s*\)/gi, "(CURRENT_TIMESTAMP + INTERVAL '$1 day')")
    .replace(/\b([A-Za-z]+)\s+LIKE\s+'%'\s*\+\s*(@\w+)\s*\+\s*'%'/gi, "$1 LIKE ('%' || COALESCE($2, '') || '%')")
    .replace(/\b([A-Za-z]+)\s+LIKE\s+'%'\s*\+\s*COALESCE\((@\w+),\s*''\)\s*\+\s*'%'/gi, "$1 LIKE ('%' || COALESCE($2, '') || '%')")
    .replace(/@(isActive|isFeatured|isVerified|requiresPrescription|isPaid|containsPrescriptionItems|prescriptionAcknowledged|isPublished)\s*=\s*1\b/gi, "@$1 = TRUE")
    .replace(/@(isActive|isFeatured|isVerified|requiresPrescription|isPaid|containsPrescriptionItems|prescriptionAcknowledged|isPublished)\s*=\s*0\b/gi, "@$1 = FALSE")
    .replace(/\b(IsActive|IsFeatured|IsVerified|RequiresPrescription|IsPaid|ContainsPrescriptionItems|PrescriptionAcknowledged|IsPublished)\s*=\s*1\b/gi, "$1 = TRUE")
    .replace(/\b(IsActive|IsFeatured|IsVerified|RequiresPrescription|IsPaid|ContainsPrescriptionItems|PrescriptionAcknowledged|IsPublished)\s*=\s*0\b/gi, "$1 = FALSE");

  let limit;
  text = text.replace(/\bTOP\s*(?:\(\s*)?(@[A-Za-z_]\w*|\d+)\s*\)?/i, (_, value) => {
    limit = value;
    return "";
  });

  text = text.replace(/OFFSET\s+(@[A-Za-z_]\w*|\d+)\s+ROWS\s+FETCH\s+NEXT\s+(@[A-Za-z_]\w*|\d+)\s+ROWS\s+ONLY/gi, "OFFSET $1 LIMIT $2");

  if (limit) {
    text = text.replace(/;\s*$/g, "").trimEnd();
    text += ` LIMIT ${limit}`;
  }

  let returning;
  const output = text.match(/\s+OUTPUT\s+(.+?)(?=\s+(?:VALUES|WHERE)\b)/is);
  if (output) {
    returning = output[1]
      .split(",")
      .map((column) => column.trim().replace(/^inserted\./i, ""))
      .filter(Boolean)
      .join(", ");
    text = text.replace(output[0], " ");
  }

  const values = [];
  const seen = new Map();
  text = text.replace(/@([A-Za-z_]\w*)/g, (_, name) => {
    if (!seen.has(name)) {
      seen.set(name, values.length + 1);
      values.push({ name });
    }
    return `$${seen.get(name)}`;
  });

  if (returning) {
    text = text.replace(/;\s*$/g, "").trimEnd();
    text += ` RETURNING ${returning}`;
  }

  return { text, values };
};

class PostgresRequest {
  constructor(executor) {
    this.executor = executor;
    this.parameters = new Map();
  }

  input(name, _type, value) {
    this.parameters.set(name, value);
    return this;
  }

  async query(source) {
    const rewritten = rewriteSql(source);
    const values = rewritten.values.map(({ name }) => this.parameters.get(name));
    const result = await this.executor.query(rewritten.text, values);
    const rows = result.rows.map(normalizeRow);
    return { recordset: rows, recordsets: [rows], rowsAffected: [result.rowCount || 0] };
  }

  async batch(source) {
    const statements = String(source)
      .split(/;\s*(?=(?:SELECT|UPDATE|INSERT|DELETE|CREATE|ALTER|DROP)\b)/i)
      .map((statement) => statement.trim())
      .filter(Boolean);
    const recordsets = [];
    for (const statement of statements) {
      const result = await this.query(statement);
      recordsets.push(result.recordset);
    }
    return { recordsets, recordset: recordsets.at(-1) || [] };
  }
}

class PostgresClient {
  constructor(client) { this.client = client; }
  query(...args) { return this.client.query(...args); }
  request() { return new PostgresRequest(this); }
  release() { this.client.release(); }
}

export class PostgresPool {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX || 10),
      ssl: { rejectUnauthorized: false },
    });
  }

  request() { return new PostgresRequest(this.pool); }
  query(...args) { return this.pool.query(...args); }
  async connect() { return new PostgresClient(await this.pool.connect()); }
  async close() { return this.pool.end(); }
}

export const postgresSql = {
  UniqueIdentifier: "uuid",
  NVarChar: () => "text",
  VarChar: () => "text",
  Decimal: () => "numeric",
  Int: "integer",
  TinyInt: "smallint",
  Bit: "boolean",
  DateTime2: "timestamptz",
  Date: "date",
  VarBinary: () => "bytea",
  MAX: "max",
  ISOLATION_LEVEL: { SERIALIZABLE: "SERIALIZABLE" },
};
