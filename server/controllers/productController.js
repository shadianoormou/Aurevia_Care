import { createRequest, sql } from "../config/db.js";
import { getKeywordsForSymptom } from "../data/symptomMap.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { clampInt, cleanText, httpError, requireUuid } from "../utils/http.js";
import { serializeProduct } from "../utils/serializers.js";

const productSelect = `
  SELECT p.Id, p.CategoryId, p.SubcategoryId, p.Name, p.Brand, p.Description, p.Symptoms, p.Price,
         p.Stock, p.LowStockThreshold, p.ImageUrl, p.ImagePublicId, p.RequiresPrescription,
         p.Rating, p.NumReviews, p.IsVerified, p.VerifiedBy, p.VerifiedAt, p.IsActive,
         p.CreatedAt, p.UpdatedAt, c.Name AS CategoryName, c.Icon AS CategoryIcon,
         sc.Name AS SubcategoryName, sc.Icon AS SubcategoryIcon
  FROM dbo.Products p
  INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
  LEFT JOIN dbo.Subcategories sc ON sc.Id = p.SubcategoryId
`;

const loadProductRow = async (id, transaction) => {
  const request = await createRequest(transaction);
  request.input("id", sql.UniqueIdentifier, id);
  const { recordset } = await request.query(`${productSelect} WHERE p.Id = @id`);
  return recordset[0] || null;
};

const parseSymptoms = (value) => {
  if (Array.isArray(value)) return value.map((entry) => cleanText(String(entry), 60).toLowerCase()).filter(Boolean).slice(0, 20);
  if (typeof value !== "string") return [];
  try { return parseSymptoms(JSON.parse(value)); } catch {
    return value.split(",").map((entry) => cleanText(entry, 60).toLowerCase()).filter(Boolean).slice(0, 20);
  }
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const finiteNumber = (value, label, fallback) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw httpError(`${label} must be a non-negative number`);
  return parsed;
};

const productInput = (request, product) => {
  request.input("categoryId", sql.UniqueIdentifier, product.categoryId);
  request.input("subcategoryId", sql.UniqueIdentifier, product.subcategoryId || null);
  request.input("name", sql.NVarChar(180), product.name);
  request.input("brand", sql.NVarChar(120), product.brand || null);
  request.input("description", sql.NVarChar(sql.MAX), product.description);
  request.input("symptoms", sql.NVarChar(sql.MAX), JSON.stringify(product.symptoms));
  request.input("price", sql.Decimal(12, 2), product.price);
  request.input("stock", sql.Int, product.stock);
  request.input("lowStockThreshold", sql.Int, product.lowStockThreshold);
  request.input("imageUrl", sql.NVarChar(2048), product.imageUrl || null);
  request.input("imagePublicId", sql.NVarChar(255), product.imagePublicId || null);
  request.input("requiresPrescription", sql.Bit, product.requiresPrescription);
};

const validateSubcategory = async (product) => {
  if (!product.subcategoryId) return;
  const request = await createRequest();
  request.input("categoryId", sql.UniqueIdentifier, product.categoryId);
  request.input("subcategoryId", sql.UniqueIdentifier, product.subcategoryId);
  const { recordset } = await request.query("SELECT Id FROM dbo.Subcategories WHERE Id = @subcategoryId AND CategoryId = @categoryId AND IsActive = 1");
  if (!recordset[0]) throw httpError("Selected subcategory does not belong to the selected category");
};

const normalizeForWrite = (body, current = {}) => {
  const name = cleanText(body.name, 180) || current.Name;
  const description = cleanText(body.description, 8000) || current.Description;
  const categoryId = body.category || current.CategoryId;
  const subcategoryId = body.subcategory !== undefined ? body.subcategory : current.SubcategoryId;
  if (!name || !description || !categoryId) throw httpError("Name, description, and category are required");
  requireUuid(categoryId, "category ID");
  if (subcategoryId) requireUuid(subcategoryId, "subcategory ID");
  if (!current.Id && (body.price === undefined || body.stock === undefined)) {
    throw httpError("Price and stock are required for a new product");
  }
  const stock = finiteNumber(body.stock, "Stock", current.Stock ?? 0);
  const lowStockThreshold = finiteNumber(body.lowStockThreshold, "Low stock threshold", current.LowStockThreshold ?? 10);
  if (!Number.isInteger(stock) || !Number.isInteger(lowStockThreshold)) throw httpError("Stock values must be whole numbers");
  return {
    categoryId, subcategoryId: subcategoryId || null,
    name,
    brand: cleanText(body.brand, 120) || current.Brand || "",
    description,
    symptoms: body.symptoms !== undefined ? parseSymptoms(body.symptoms) : parseSymptoms(current.Symptoms),
    price: finiteNumber(body.price, "Price", Number(current.Price ?? 0)),
    stock,
    lowStockThreshold,
    imageUrl: cleanText(body.image, 2048) || current.ImageUrl || "",
    imagePublicId: current.ImagePublicId || "",
    requiresPrescription: body.requiresPrescription !== undefined
      ? parseBoolean(body.requiresPrescription)
      : Boolean(current.RequiresPrescription),
  };
};

export const getProducts = async (req, res, next) => {
  try {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 12, 1, 100);
    const sortMap = { price_asc: "p.Price ASC", price_desc: "p.Price DESC", popular: "p.NumReviews DESC, p.Rating DESC", rating: "p.Rating DESC, p.NumReviews DESC" };
    const sort = sortMap[req.query.sort] || "p.CreatedAt DESC";
    const filters = ["p.IsActive = 1"];
    const request = await createRequest();

    if (req.query.keyword) {
      request.input("keyword", sql.NVarChar(240), `%${cleanText(req.query.keyword, 240)}%`);
      filters.push("(p.Name LIKE @keyword OR p.Brand LIKE @keyword OR p.Description LIKE @keyword OR p.Symptoms LIKE @keyword)");
    }
    if (req.query.category) {
      requireUuid(req.query.category, "category ID");
      request.input("category", sql.UniqueIdentifier, req.query.category);
      filters.push("p.CategoryId = @category");
    }
    if (req.query.subcategory) {
      requireUuid(req.query.subcategory, "subcategory ID");
      request.input("subcategory", sql.UniqueIdentifier, req.query.subcategory);
      filters.push("p.SubcategoryId = @subcategory");
    }
    if (req.query.minPrice !== undefined) {
      request.input("minPrice", sql.Decimal(12, 2), finiteNumber(req.query.minPrice, "Minimum price", 0));
      filters.push("p.Price >= @minPrice");
    }
    if (req.query.maxPrice !== undefined) {
      request.input("maxPrice", sql.Decimal(12, 2), finiteNumber(req.query.maxPrice, "Maximum price", 0));
      filters.push("p.Price <= @maxPrice");
    }
    if (req.query.inStock === "true") filters.push("p.Stock > 0");
    request.input("offset", sql.Int, (page - 1) * limit);
    request.input("limit", sql.Int, limit);
    const where = filters.join(" AND ");
    const { recordsets } = await request.batch(`
      ${productSelect} WHERE ${where}
      ORDER BY ${sort} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      SELECT COUNT(1) AS Total FROM dbo.Products p WHERE ${where};
    `);
    const total = Number(recordsets[1][0].Total);
    res.status(200).json({
      success: true, count: recordsets[0].length, total, page,
      pages: Math.max(1, Math.ceil(total / limit)), products: recordsets[0].map(serializeProduct),
    });
  } catch (error) { next(error); }
};

export const getProductById = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "product ID");
    const product = await loadProductRow(req.params.id);
    if (!product || !product.IsActive) throw httpError("Product not found", 404);
    res.status(200).json({ success: true, product: serializeProduct(product) });
  } catch (error) { next(error); }
};

export const smartSearch = async (req, res, next) => {
  try {
    const query = cleanText(req.query.q, 120);
    if (!query) throw httpError("Search query 'q' is required");
    const keywords = [...new Set([query, ...getKeywordsForSymptom(query)])].slice(0, 12);
    const request = await createRequest();
    const conditions = keywords.map((keyword, index) => {
      const name = `keyword${index}`;
      request.input(name, sql.NVarChar(120), `%${keyword}%`);
      return `(p.Name LIKE @${name} OR p.Description LIKE @${name} OR p.Symptoms LIKE @${name})`;
    });
    const { recordset } = await request.query(`${productSelect} WHERE p.IsActive = 1 AND (${conditions.join(" OR ")}) ORDER BY p.Rating DESC, p.NumReviews DESC`);
    res.status(200).json({
      success: true, query, matchedKeywords: keywords, count: recordset.length,
      products: recordset.slice(0, 20).map(serializeProduct),
      disclaimer: "Search results help you discover products and are not medical advice. Ask a qualified clinician or pharmacist before taking medicine.",
    });
  } catch (error) { next(error); }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const request = await createRequest();
    const filters = ["p.IsActive = 1"];
    if (req.query.category) {
      requireUuid(req.query.category, "category ID");
      request.input("category", sql.UniqueIdentifier, req.query.category);
      filters.push("p.CategoryId = @category");
    }
    if (req.query.exclude) {
      requireUuid(req.query.exclude, "product ID");
      request.input("exclude", sql.UniqueIdentifier, req.query.exclude);
      filters.push("p.Id <> @exclude");
    }
    const { recordset } = await request.query(`${productSelect} WHERE ${filters.join(" AND ")} ORDER BY p.Rating DESC, p.NumReviews DESC, p.CreatedAt DESC OFFSET 0 ROWS FETCH NEXT 8 ROWS ONLY`);
    res.status(200).json({ success: true, products: recordset.map(serializeProduct) });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = normalizeForWrite(req.body);
    await validateSubcategory(product);
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer);
      product.imageUrl = uploaded.secure_url;
      product.imagePublicId = uploaded.public_id;
    }
    const request = await createRequest();
    productInput(request, product);
    const { recordset } = await request.query(`
      INSERT INTO dbo.Products (CategoryId, SubcategoryId, Name, Brand, Description, Symptoms, Price, Stock,
        LowStockThreshold, ImageUrl, ImagePublicId, RequiresPrescription)
      OUTPUT inserted.Id VALUES (@categoryId, @subcategoryId, @name, @brand, @description, @symptoms, @price, @stock,
        @lowStockThreshold, @imageUrl, @imagePublicId, @requiresPrescription)
    `);
    const created = await loadProductRow(recordset[0].Id);
    res.status(201).json({ success: true, product: serializeProduct(created) });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "product ID");
    const existing = await loadProductRow(req.params.id);
    if (!existing) throw httpError("Product not found", 404);
    const product = normalizeForWrite(req.body, existing);
    await validateSubcategory(product);
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer);
      await deleteFromCloudinary(existing.ImagePublicId);
      product.imageUrl = uploaded.secure_url;
      product.imagePublicId = uploaded.public_id;
    }
    const request = await createRequest();
    productInput(request, product);
    request.input("id", sql.UniqueIdentifier, req.params.id);
    await request.query(`UPDATE dbo.Products SET CategoryId = @categoryId, SubcategoryId = @subcategoryId, Name = @name, Brand = @brand,
      Description = @description, Symptoms = @symptoms, Price = @price, Stock = @stock,
      LowStockThreshold = @lowStockThreshold, ImageUrl = @imageUrl, ImagePublicId = @imagePublicId,
      RequiresPrescription = @requiresPrescription, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id`);
    const updated = await loadProductRow(req.params.id);
    res.status(200).json({ success: true, product: serializeProduct(updated) });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "product ID");
    const existing = await loadProductRow(req.params.id);
    if (!existing) throw httpError("Product not found", 404);
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    await request.query("UPDATE dbo.Products SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id");
    res.status(200).json({ success: true, message: "Product archived successfully" });
  } catch (error) { next(error); }
};

export const updateStock = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "product ID");
    const stock = finiteNumber(req.body.stock, "Stock");
    if (!Number.isInteger(stock)) throw httpError("Stock must be a whole number");
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    request.input("stock", sql.Int, stock);
    const result = await request.query("UPDATE dbo.Products SET Stock = @stock, UpdatedAt = SYSUTCDATETIME() OUTPUT inserted.Id WHERE Id = @id");
    if (!result.recordset[0]) throw httpError("Product not found", 404);
    res.status(200).json({ success: true, product: serializeProduct(await loadProductRow(req.params.id)) });
  } catch (error) { next(error); }
};

export const verifyProduct = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "product ID");
    const isVerified = parseBoolean(req.body.isVerified, true);
    const request = await createRequest();
    request.input("id", sql.UniqueIdentifier, req.params.id);
    request.input("isVerified", sql.Bit, isVerified);
    request.input("verifiedBy", sql.UniqueIdentifier, isVerified ? req.user._id : null);
    const result = await request.query(`UPDATE dbo.Products SET IsVerified = @isVerified,
      VerifiedBy = @verifiedBy, VerifiedAt = CASE WHEN @isVerified = 1 THEN SYSUTCDATETIME() ELSE NULL END,
      UpdatedAt = SYSUTCDATETIME() OUTPUT inserted.Id WHERE Id = @id`);
    if (!result.recordset[0]) throw httpError("Product not found", 404);
    res.status(200).json({ success: true, product: serializeProduct(await loadProductRow(req.params.id)) });
  } catch (error) { next(error); }
};
