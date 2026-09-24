import { createRequest, sql } from "../config/db.js";
import { cleanText, httpError, requireUuid } from "../utils/http.js";
import { serializeCategory } from "../utils/serializers.js";

const categoryColumns = "Id, Name, Description, Icon, SortOrder, IsFeatured, CreatedAt, UpdatedAt";
const outputColumns = categoryColumns.replaceAll(", ", ", inserted.");

const categoryInput = (request, body) => {
  const name = cleanText(body.name, 120);
  if (!name) throw httpError("Category name is required");
  const sortOrder = body.sortOrder === undefined || body.sortOrder === "" ? 999 : Number(body.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) throw httpError("Sort order must be a non-negative whole number");
  request.input("name", sql.NVarChar(120), name);
  request.input("description", sql.NVarChar(1000), cleanText(body.description, 1000) || null);
  request.input("icon", sql.NVarChar(20), cleanText(body.icon, 20) || null);
  request.input("sortOrder", sql.Int, sortOrder);
  request.input("isFeatured", sql.Bit, body.isFeatured === true || body.isFeatured === "true");
};

export const getCategories = async (req, res, next) => {
  try {
    const request = await createRequest();
    const { recordsets } = await request.batch(`
      SELECT ${categoryColumns} FROM dbo.Categories ORDER BY IsFeatured DESC, SortOrder ASC, Name ASC;
      SELECT Id, CategoryId, Name, Description, Icon, SortOrder, IsActive
      FROM dbo.Subcategories WHERE IsActive = 1 ORDER BY SortOrder ASC, Name ASC;
    `);
    const subcategoriesByCategory = new Map();
    recordsets[1].forEach((row) => {
      const current = subcategoriesByCategory.get(row.CategoryId) || [];
      current.push({ _id: row.Id, name: row.Name, description: row.Description || "", icon: row.Icon || "", sortOrder: Number(row.SortOrder) });
      subcategoriesByCategory.set(row.CategoryId, current);
    });
    res.status(200).json({
      success: true,
      categories: recordsets[0].map((row) => ({ ...serializeCategory(row), subcategories: subcategoriesByCategory.get(row.Id) || [] })),
    });
  } catch (error) { next(error); }
};

export const createCategory = async (req, res, next) => {
  try {
    const request = await createRequest();
    categoryInput(request, req.body);
    const { recordset } = await request.query(`INSERT INTO dbo.Categories (Name, Description, Icon, SortOrder, IsFeatured)
      OUTPUT inserted.${outputColumns} VALUES (@name, @description, @icon, @sortOrder, @isFeatured)`);
    res.status(201).json({ success: true, category: serializeCategory(recordset[0]) });
  } catch (error) { next(error); }
};

export const updateCategory = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "category ID");
    const request = await createRequest();
    categoryInput(request, req.body);
    request.input("id", sql.UniqueIdentifier, req.params.id);
    const { recordset } = await request.query(`UPDATE dbo.Categories SET Name = @name,
      Description = @description, Icon = @icon, SortOrder = @sortOrder, IsFeatured = @isFeatured, UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.${outputColumns} WHERE Id = @id`);
    if (!recordset[0]) throw httpError("Category not found", 404);
    res.status(200).json({ success: true, category: serializeCategory(recordset[0]) });
  } catch (error) { next(error); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "category ID");
    const checkRequest = await createRequest();
    checkRequest.input("id", sql.UniqueIdentifier, req.params.id);
    const check = await checkRequest.query("SELECT COUNT(1) AS Count FROM dbo.Products WHERE CategoryId = @id");
    if (Number(check.recordset[0].Count) > 0) throw httpError("Cannot delete a category while products use it");
    const deleteRequest = await createRequest();
    deleteRequest.input("id", sql.UniqueIdentifier, req.params.id);
    const result = await deleteRequest.query("DELETE FROM dbo.Categories WHERE Id = @id");
    if (!result.rowsAffected[0]) throw httpError("Category not found", 404);
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) { next(error); }
};
