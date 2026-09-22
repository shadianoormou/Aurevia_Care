import jwt from "jsonwebtoken";
import { createRequest, sql } from "../config/db.js";
import { serializeUser } from "../utils/serializers.js";

// Verifies the JWT token (from cookie or Authorization header)
// and attaches the logged-in user to req.user
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, decoded.id);
    const { recordset } = await request.query(`
      SELECT Id, Name, Email, Phone, AddressStreet, AddressCity, AddressState,
             AddressZipCode, AddressCountry, Role, IsActive, CreatedAt, UpdatedAt
      FROM dbo.Users WHERE Id = @id
    `);
    const user = recordset[0] ? serializeUser(recordset[0]) : null;
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid or expired",
    });
  }
};

// Restricts access to specific roles
// Usage: authorize("admin"), authorize("admin", "pharmacist")
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not allowed to access this resource`,
      });
    }
    next();
  };
};
