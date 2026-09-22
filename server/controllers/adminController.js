import { createRequest, sql } from "../config/db.js";
import { httpError, requireUuid } from "../utils/http.js";
import { serializeProduct, serializeUser } from "../utils/serializers.js";

const productSelect = `
  SELECT p.Id, p.CategoryId, p.Name, p.Brand, p.Description, p.Symptoms, p.Price,
         p.Stock, p.LowStockThreshold, p.ImageUrl, p.ImagePublicId, p.RequiresPrescription,
         p.Rating, p.NumReviews, p.IsVerified, p.VerifiedBy, p.VerifiedAt, p.IsActive,
         p.CreatedAt, p.UpdatedAt, c.Name AS CategoryName, c.Icon AS CategoryIcon
  FROM dbo.Products p INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
`;

const userColumns = "Id, Name, Email, Phone, AddressStreet, AddressCity, AddressState, AddressZipCode, AddressCountry, Role, IsActive, CreatedAt, UpdatedAt";
const outputColumns = userColumns.replaceAll(", ", ", inserted.");

export const getStats = async (req, res, next) => {
  try {
    const request = await createRequest();
    const { recordsets } = await request.batch(`
      SELECT COUNT(1) AS TotalUsers FROM dbo.Users WHERE Role = 'customer';
      SELECT COUNT(1) AS TotalProducts FROM dbo.Products WHERE IsActive = 1;
      SELECT COUNT(1) AS TotalOrders FROM dbo.Orders;
      SELECT COALESCE(SUM(TotalPrice), 0) AS TotalSales FROM dbo.Orders WHERE Status = 'Delivered';
      SELECT CAST(CreatedAt AS DATE) AS SaleDate, COALESCE(SUM(TotalPrice), 0) AS Sales, COUNT(1) AS Orders
      FROM dbo.Orders WHERE Status = 'Delivered' AND CreatedAt >= DATEADD(DAY, -6, CAST(SYSUTCDATETIME() AS DATE))
      GROUP BY CAST(CreatedAt AS DATE) ORDER BY SaleDate;
      SELECT Status AS [Status], COUNT(1) AS Count FROM dbo.Orders GROUP BY Status;
    `);
    const days = new Map(recordsets[4].map((row) => [new Date(row.SaleDate).toISOString().slice(0, 10), row]));
    const salesByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const value = days.get(key);
      return { date: key, sales: Number(value?.Sales || 0), orders: Number(value?.Orders || 0) };
    });
    res.status(200).json({
      success: true,
      stats: {
        totalUsers: Number(recordsets[0][0].TotalUsers), totalProducts: Number(recordsets[1][0].TotalProducts),
        totalOrders: Number(recordsets[2][0].TotalOrders), totalSales: Number(recordsets[3][0].TotalSales),
        salesByDay, ordersByStatus: recordsets[5].map((row) => ({ _id: row.Status, count: Number(row.Count) })),
      },
    });
  } catch (error) { next(error); }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const request = await createRequest();
    const { recordset } = await request.query(`${productSelect} WHERE p.IsActive = 1 AND p.Stock <= p.LowStockThreshold ORDER BY p.Stock ASC`);
    res.status(200).json({ success: true, count: recordset.length, products: recordset.map(serializeProduct) });
  } catch (error) { next(error); }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const request = await createRequest();
    const { recordset } = await request.query(`SELECT ${userColumns} FROM dbo.Users ORDER BY CreatedAt DESC`);
    res.status(200).json({ success: true, count: recordset.length, users: recordset.map(serializeUser) });
  } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "user ID");
    const requestedRole = req.body.role;
    const role = ["customer", "pharmacist", "admin"].includes(requestedRole) ? requestedRole : null;
    const isActive = typeof req.body.isActive === "boolean" ? req.body.isActive : null;
    if (!role && isActive === null) throw httpError("Provide a valid role or active status");
    if (req.params.id === req.user._id && (role !== "admin" || isActive === false)) {
      throw httpError("You cannot remove or deactivate your own administrator access");
    }
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    request.input("role", sql.VarChar(20), role);
    request.input("isActive", sql.Bit, isActive);
    const { recordset } = await request.query(`UPDATE dbo.Users SET
      Role = COALESCE(@role, Role), IsActive = COALESCE(@isActive, IsActive), UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.${outputColumns} WHERE Id = @id`);
    if (!recordset[0]) throw httpError("User not found", 404);
    res.status(200).json({ success: true, user: serializeUser(recordset[0]) });
  } catch (error) { next(error); }
};

export const deleteUser = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "user ID");
    if (req.params.id === req.user._id) throw httpError("You cannot deactivate your own account");
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    const result = await request.query(`UPDATE dbo.Users SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id AND IsActive = 1`);
    if (!result.rowsAffected[0]) throw httpError("Active user not found", 404);
    res.status(200).json({ success: true, message: "User account deactivated successfully" });
  } catch (error) { next(error); }
};
