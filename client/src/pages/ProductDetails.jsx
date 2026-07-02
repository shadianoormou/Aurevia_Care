import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiStar, FiMinus, FiPlus, FiShoppingCart, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import api from "../api/axios.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { formatPrice } from "../utils/currency.js";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: productData }, { data: reviewData }] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/${id}`),
      ]);
      setProduct(productData.product);
      setReviews(reviewData.reviews);
      setQty(1);

      const { data: recData } = await api.get("/products/recommendations", {
        params: { category: productData.product.category?._id, exclude: id },
      });
      setRecommended(recData.products);
    } catch (error) {
      toast.error("Product not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitReview = async (formData) => {
    try {
      await api.post(`/reviews/${id}`, {
        rating: Number(formData.rating),
        comment: formData.comment,
      });
      toast.success("Review submitted!");
      reset();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit review");
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        <img
          src={product.image || "https://placehold.co/600x500?text=MediMart"}
          alt={product.name}
          className="w-full rounded-xl border border-gray-100 object-cover max-h-[420px]"
        />

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-primary-700 font-medium">{product.category?.name}</p>
            {product.isVerified && (
              <span className="flex items-center gap-1 text-xs text-primary-700 font-medium bg-primary-50 px-2 py-1 rounded-full">
                <FiCheckCircle className="text-primary-600" /> Verified by pharmacist
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.brand}</p>

          <div className="flex items-center gap-1 mt-3 text-yellow-500">
            <FiStar className="fill-current" />
            <span className="text-gray-700 text-sm">{product.rating?.toFixed(1)} ({product.numReviews} reviews)</span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mt-4">{formatPrice(product.price)}</p>

          <p className={`text-sm mt-2 font-medium ${product.stock > 0 ? "text-primary-700" : "text-red-500"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.requiresPrescription && (
            <p className="flex items-start gap-2 text-xs bg-accent-50 text-accent-700 rounded px-3 py-2 mt-3">
              <FiAlertTriangle className="shrink-0 mt-0.5" />
              This medicine requires a valid prescription. You will be asked to confirm
              this at checkout.
            </p>
          )}

          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          {product.stock > 0 && (
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 text-gray-600 hover:text-primary-600">
                  <FiMinus />
                </button>
                <span className="px-4 text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="p-2 text-gray-600 hover:text-primary-600">
                  <FiPlus />
                </button>
              </div>
              <button onClick={() => addToCart(product, qty)} className="btn-primary flex items-center gap-2">
                <FiShoppingCart /> Add to Cart
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-6 border-t border-gray-100 pt-4">
            ⚠️ This platform does not provide medical advice. Please consult a doctor or
            pharmacist before taking medicine.
          </p>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-14 max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>

        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product.</p>
        ) : (
          <div className="space-y-4 mb-8">
            {reviews.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">{r.name}</span>
                  <span className="flex items-center gap-1 text-yellow-500 text-sm">
                    <FiStar className="fill-current" /> {r.rating}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        {user ? (
          <form onSubmit={handleSubmit(submitReview)} className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Write a Review</h3>
            <div>
              <label className="text-sm text-gray-600">Rating</label>
              <select {...register("rating", { required: true })} className="input-field mt-1">
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Comment</label>
              <textarea
                {...register("comment", { required: "Comment is required" })}
                rows={3}
                className="input-field mt-1"
                placeholder="Share your experience with this product..."
              />
              {errors.comment && <p className="text-xs text-red-500 mt-1">{errors.comment.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            <Link to="/login" className="text-primary-600 font-medium">Log in</Link> to write a review.
          </p>
        )}
      </section>

      {/* Recommendations */}
      {recommended.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended For You</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {recommended.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
