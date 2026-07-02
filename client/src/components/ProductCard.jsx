import { Link } from "react-router-dom";
import { FiStar, FiShoppingCart, FiCheckCircle } from "react-icons/fi";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/currency.js";

// Product card used across Home, Products, and Recommendations
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <div className="card overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <Link to={`/products/${product._id}`} className="block relative">
        <img
          src={product.image || "https://placehold.co/400x300?text=MediMart"}
          alt={product.name}
          className="w-full h-44 object-cover group-hover:scale-[1.03] transition-transform duration-200"
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
            Out of Stock
          </span>
        )}
        {product.requiresPrescription && (
          <span className="absolute top-2 right-2 bg-accent-600 text-white text-xs font-medium px-2 py-1 rounded">
            Rx
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-primary-700 font-medium">{product.category?.name}</p>
          {product.isVerified && (
            <span className="flex items-center gap-1 text-[11px] text-primary-700 font-medium shrink-0">
              <FiCheckCircle className="text-primary-600" /> Verified
            </span>
          )}
        </div>
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 hover:text-primary-700">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1">{product.brand}</p>

        {product.requiresPrescription && (
          <p className="text-[11px] text-accent-700 mt-1">⚠ Prescription required</p>
        )}

        <div className="flex items-center gap-1 mt-2 text-sm text-yellow-500">
          <FiStar className="fill-current" />
          <span className="text-gray-700">{product.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-gray-400">({product.numReviews || 0})</span>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
          <button
            onClick={() => addToCart(product, 1)}
            disabled={outOfStock}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            title="Add to cart"
          >
            <FiShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
