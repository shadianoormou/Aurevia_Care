import { createRequest, sql, withTransaction } from "../config/db.js";
import { cleanText, httpError, requireUuid } from "../utils/http.js";
import { serializeReview } from "../utils/serializers.js";

const reviewColumns = "Id, ProductId, UserId, Name, Rating, Comment, CreatedAt, UpdatedAt";
const outputColumns = reviewColumns.replaceAll(", ", ", inserted.");

const refreshRating = async (productId, transaction) => {
  const request = await createRequest(transaction);
  request.input("productId", sql.UniqueIdentifier, productId);
  await request.query(`
    UPDATE dbo.Products SET
      Rating = COALESCE((SELECT CAST(AVG(CAST(Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) FROM dbo.Reviews WHERE ProductId = @productId), 0),
      NumReviews = (SELECT COUNT(1) FROM dbo.Reviews WHERE ProductId = @productId),
      UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @productId
  `);
};

export const addReview = async (req, res, next) => {
  try {
    requireUuid(req.params.productId, "product ID");
    const rating = Number(req.body.rating);
    const comment = cleanText(req.body.comment, 2000);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      throw httpError("A rating from 1 to 5 and a comment are required");
    }
    const review = await withTransaction(async (transaction) => {
      const productRequest = await createRequest(transaction);
      productRequest.input("productId", sql.UniqueIdentifier, req.params.productId);
      const product = await productRequest.query("SELECT Id FROM dbo.Products WITH (UPDLOCK, HOLDLOCK) WHERE Id = @productId AND IsActive = 1");
      if (!product.recordset[0]) throw httpError("Product not found", 404);

      const request = await createRequest(transaction);
      request.input("productId", sql.UniqueIdentifier, req.params.productId);
      request.input("userId", sql.UniqueIdentifier, req.user._id);
      request.input("name", sql.NVarChar(120), req.user.name);
      request.input("rating", sql.TinyInt, rating);
      request.input("comment", sql.NVarChar(2000), comment);
      const result = await request.query(`INSERT INTO dbo.Reviews (ProductId, UserId, Name, Rating, Comment)
        OUTPUT inserted.${outputColumns} VALUES (@productId, @userId, @name, @rating, @comment)`);
      await refreshRating(req.params.productId, transaction);
      return result.recordset[0];
    });
    res.status(201).json({ success: true, review: serializeReview(review) });
  } catch (error) { next(error); }
};

export const getProductReviews = async (req, res, next) => {
  try {
    requireUuid(req.params.productId, "product ID");
    const request = await createRequest();
    request.input("productId", sql.UniqueIdentifier, req.params.productId);
    const { recordset } = await request.query(`SELECT ${reviewColumns} FROM dbo.Reviews
      WHERE ProductId = @productId ORDER BY CreatedAt DESC`);
    res.status(200).json({ success: true, count: recordset.length, reviews: recordset.map(serializeReview) });
  } catch (error) { next(error); }
};
