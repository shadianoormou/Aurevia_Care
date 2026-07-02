import Product from "../models/Product.js";
import { getKeywordsForSymptom } from "../data/symptomMap.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// multipart/form-data always sends text fields as strings, so numbers,
// booleans, and arrays need to be converted back to the right type
// before they reach Mongoose. JSON body requests (no file) already have
// the correct types, so this is safe to run on both.
const normalizeProductBody = (body) => {
  const data = { ...body };

  if (typeof data.symptoms === "string") {
    try {
      data.symptoms = JSON.parse(data.symptoms);
    } catch {
      data.symptoms = data.symptoms.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
  }

  if (typeof data.requiresPrescription === "string") {
    data.requiresPrescription = data.requiresPrescription === "true";
  }

  ["price", "stock", "lowStockThreshold"].forEach((field) => {
    if (data[field] !== undefined && data[field] !== "") {
      data[field] = Number(data[field]);
    }
  });

  return data;
};

// @desc    Get all products with filter/sort/pagination
// @route   GET /api/products
// @access  Public
// Supported query params:
//   keyword, category, minPrice, maxPrice, inStock, sort, page, limit
export const getProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (category) query.category = category;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") query.stock = { $gt: 0 };

    let sortOption = { createdAt: -1 }; // newest by default
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "popular") sortOption = { numReviews: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Smart symptom-based search (AI feature)
// @route   GET /api/products/search?q=fever
// @access  Public
export const smartSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: "Search query 'q' is required" });
    }

    const keywords = getKeywordsForSymptom(q);

    const regexConditions = keywords.map((k) => ({
      $or: [
        { name: { $regex: k, $options: "i" } },
        { description: { $regex: k, $options: "i" } },
        { symptoms: { $regex: k, $options: "i" } },
      ],
    }));

    const products = await Product.find({
      isActive: true,
      $or: regexConditions.flatMap((c) => c.$or),
    })
      .populate("category", "name")
      .limit(20);

    res.status(200).json({
      success: true,
      query: q,
      matchedKeywords: keywords,
      count: products.length,
      products,
      disclaimer:
        "This platform does not provide medical advice. Please consult a doctor or pharmacist before taking medicine.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get "Recommended for you" products based on category
// @route   GET /api/products/recommendations?category=&exclude=
// @access  Public
export const getRecommendations = async (req, res, next) => {
  try {
    const { category, exclude } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (exclude) query._id = { $ne: exclude };

    // Simple recommendation: same category, highest rated first
    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ rating: -1, numReviews: -1 })
      .limit(8);

    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products/admin
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const productData = normalizeProductBody(req.body);

    // If an image file was uploaded (multipart/form-data via multer memory storage),
    // stream it to Cloudinary now. Otherwise fall back to the image URL text field.
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      productData.image = result.secure_url;
      productData.imagePublicId = result.public_id;
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    Object.assign(product, normalizeProductBody(req.body));

    if (req.file) {
      // Delete the old Cloudinary image (if any) before saving the new one
      await deleteFromCloudinary(product.imagePublicId);

      const result = await uploadBufferToCloudinary(req.file.buffer);
      product.image = result.secure_url;
      product.imagePublicId = result.public_id;
    }

    const updated = await product.save();
    res.status(200).json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/admin/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await deleteFromCloudinary(product.imagePublicId);
    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock (used by pharmacist/manager and admin)
// @route   PUT /api/products/admin/:id/stock
// @access  Private/Admin/Pharmacist
export const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or unverify a product's medicine/product information
// @route   PUT /api/products/admin/:id/verify
// @access  Private/Admin/Pharmacist
export const verifyProduct = async (req, res, next) => {
  try {
    const { isVerified = true } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isVerified = isVerified;
    product.verifiedBy = isVerified ? req.user._id : null;
    product.verifiedAt = isVerified ? new Date() : null;

    await product.save();

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};
