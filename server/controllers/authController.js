import bcrypt from "bcryptjs";
import { createRequest, sql } from "../config/db.js";
import { sendTokenResponse } from "../utils/generateToken.js";
import { httpError, cleanText } from "../utils/http.js";
import { serializeUser } from "../utils/serializers.js";

const userColumns = "Id, Name, Email, Phone, AddressStreet, AddressCity, AddressState, AddressZipCode, AddressCountry, Role, IsActive, CreatedAt, UpdatedAt";

const getUserById = async (id) => {
  const request = await createRequest();
  request.input("id", sql.UniqueIdentifier, id);
  const { recordset } = await request.query(`SELECT ${userColumns} FROM dbo.Users WHERE Id = @id`);
  return recordset[0] ? serializeUser(recordset[0]) : null;
};

const outputColumns = userColumns.replaceAll(", ", ", inserted.");

export const registerUser = async (req, res, next) => {
  try {
    const name = cleanText(req.body.name, 120);
    const email = cleanText(req.body.email, 254).toLowerCase();
    const password = req.body.password;
    const phone = cleanText(req.body.phone, 30);
    if (!name || !email || typeof password !== "string" || password.length < 10) {
      throw httpError("Name, email, and a password with at least 10 characters are required");
    }

    const request = await createRequest();
    request.input("email", sql.NVarChar(254), email);
    const existing = await request.query("SELECT Id FROM dbo.Users WHERE Email = @email");
    if (existing.recordset[0]) throw httpError("An account with this email already exists", 409);

    request.input("name", sql.NVarChar(120), name);
    request.input("passwordHash", sql.NVarChar(255), await bcrypt.hash(password, 12));
    request.input("phone", sql.NVarChar(30), phone || null);
    const result = await request.query(`
      INSERT INTO dbo.Users (Name, Email, PasswordHash, Phone)
      OUTPUT inserted.${outputColumns}
      VALUES (@name, @email, @passwordHash, @phone)
    `);
    sendTokenResponse(serializeUser(result.recordset[0]), 201, res);
  } catch (error) { next(error); }
};

export const loginUser = async (req, res, next) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    const password = req.body.password;
    if (!email || typeof password !== "string") throw httpError("Email and password are required");

    const request = await createRequest();
    request.input("email", sql.NVarChar(254), email);
    const { recordset } = await request.query(`SELECT ${userColumns}, PasswordHash FROM dbo.Users WHERE Email = @email`);
    const row = recordset[0];
    if (!row || !(await bcrypt.compare(password, row.PasswordHash))) throw httpError("Invalid email or password", 401);
    if (!row.IsActive) throw httpError("This account has been deactivated", 403);
    sendTokenResponse(serializeUser(row), 200, res);
  } catch (error) { next(error); }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SAME_SITE === "none",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await getUserById(req.user._id);
    if (!user) throw httpError("User not found", 404);
    res.status(200).json({ success: true, user });
  } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const existing = await getUserById(req.user._id);
    if (!existing) throw httpError("User not found", 404);
    const address = req.body.address && typeof req.body.address === "object" ? req.body.address : {};
    const name = cleanText(req.body.name, 120) || existing.name;
    const phone = cleanText(req.body.phone, 30) || existing.phone;
    const nextAddress = {
      street: cleanText(address.street, 240) || existing.address.street,
      city: cleanText(address.city, 120) || existing.address.city,
      state: cleanText(address.state, 120) || existing.address.state,
      zipCode: cleanText(address.zipCode, 30) || existing.address.zipCode,
      country: cleanText(address.country, 120) || existing.address.country,
    };
    if (req.body.password && String(req.body.password).length < 10) {
      throw httpError("New password must be at least 10 characters long");
    }

    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.user._id);
    request.input("name", sql.NVarChar(120), name);
    request.input("phone", sql.NVarChar(30), phone || null);
    request.input("street", sql.NVarChar(240), nextAddress.street || null);
    request.input("city", sql.NVarChar(120), nextAddress.city || null);
    request.input("state", sql.NVarChar(120), nextAddress.state || null);
    request.input("zipCode", sql.NVarChar(30), nextAddress.zipCode || null);
    request.input("country", sql.NVarChar(120), nextAddress.country || null);
    request.input("passwordHash", sql.NVarChar(255), req.body.password ? await bcrypt.hash(String(req.body.password), 12) : null);
    const { recordset } = await request.query(`
      UPDATE dbo.Users SET Name = @name, Phone = @phone, AddressStreet = @street,
        AddressCity = @city, AddressState = @state, AddressZipCode = @zipCode,
        AddressCountry = @country, PasswordHash = COALESCE(@passwordHash, PasswordHash),
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.${outputColumns}
      WHERE Id = @id
    `);
    res.status(200).json({ success: true, user: serializeUser(recordset[0]) });
  } catch (error) { next(error); }
};
