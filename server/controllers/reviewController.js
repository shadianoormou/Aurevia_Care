import Review from "../models/Review.js";
import Product from "../models/Product.js";

// Recalculates a product's average rating and review count
const recalculateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const rating = numReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
    : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: Number(rating.toFixed(1)),
    numReviews,
  });
};

// @desc    Add a review to a product
// @route   POST /api/reviews/:productId
// @access  Private
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });

    await recalculateProductRating(productId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};
