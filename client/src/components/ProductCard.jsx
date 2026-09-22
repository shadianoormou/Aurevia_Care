import { Link } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiShoppingCart, FiStar } from "react-icons/fi";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/currency.js";

// Product card used across Home, Products, and Recommendations
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <article className="catalog-product-card overflow-hidden flex flex-col group">
      <Link to={`/products/${product._id}`} className="block relative overflow-hidden">
        <img
          src={product.image || "https://placehold.co/400x300?text=Aurevia+Care"}
          alt={product.name}
          className="w-full h-48 sm:h-52 object-cover group-hover:scale-[1.07] transition-transform duration-700"
        />
        {outOfStock && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
            Out of Stock
          </span>
        )}
        {product.requiresPrescription && (
          <span className="absolute top-3 right-3 bg-primary-900 text-accent-200 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
            Rx
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-primary-900/40 to-transparent" />
      </Link>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[.12em] text-accent-700 font-extrabold truncate">{product.subcategory?.name || product.category?.name}</p>
          {product.isVerified && (
            <span className="flex items-center gap-1 text-[10px] text-primary-700 font-bold shrink-0">
              <FiCheckCircle className="text-primary-600" /> Verified
            </span>
          )}
        </div>
        <Link to={`/products/${product._id}`}>
          <h3 className="font-bold text-primary-900 mt-2 leading-5 line-clamp-2 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>
        <p className="text-[11px] text-gray-500 mt-1">{product.brand}</p>

        {product.requiresPrescription && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-accent-700 mt-2">Prescription review required</p>
        )}

        <div className="flex items-center gap-1 mt-3 text-xs text-yellow-500">
          <FiStar className="fill-current" />
          <span className="text-gray-700">{product.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-gray-400">({product.numReviews || 0})</span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-primary-50">
          <span className="text-lg font-extrabold text-primary-900">{formatPrice(product.price)}</span>
          <button
            onClick={() => addToCart(product, 1)}
            disabled={outOfStock}
            className="bg-primary-800 hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            title="Add to cart"
          >
            <FiShoppingCart size={18} />
          </button>
          <Link to={`/products/${product._id}`} aria-label={`View ${product.name}`} className="text-primary-600 hover:text-accent-700"><FiArrowUpRight /></Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
