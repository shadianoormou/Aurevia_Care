import { Link, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiAlertTriangle } from "react-icons/fi";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice } from "../utils/currency.js";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasPrescriptionItems = cartItems.some((item) => item.requiresPrescription);

  const handleCheckout = () => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FiShoppingBag className="mx-auto text-5xl text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-800 mt-4">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary inline-block mt-6">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      {hasPrescriptionItems && (
        <div className="flex items-start gap-3 bg-accent-50 text-accent-700 text-sm rounded-lg px-4 py-3 mb-6">
          <FiAlertTriangle className="shrink-0 mt-0.5" />
          <p>
            Your cart contains prescription-required medicine. You'll need to confirm you
            have a valid prescription before placing the order.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item._id} className="card p-4 flex items-center gap-4">
              <img
                src={item.image || "https://placehold.co/100x100?text=Med"}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item._id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1">
                  {item.name}
                </Link>
                {item.requiresPrescription && (
                  <span className="inline-block text-[11px] text-accent-700 bg-accent-50 px-2 py-0.5 rounded mt-1">
                    Rx required
                  </span>
                )}
                <p className="text-sm text-gray-500 mt-1">{formatPrice(item.price)} each</p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="p-1.5 text-gray-600 hover:text-primary-600"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1.5 text-gray-600 hover:text-primary-600 disabled:opacity-30"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1"
                  >
                    <FiTrash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{cartTotal > 500 ? "Free" : formatPrice(50)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>{formatPrice(cartTotal * 0.05)}</span>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>
              {formatPrice(cartTotal + (cartTotal > 500 ? 0 : 50) + cartTotal * 0.05)}
            </span>
          </div>
          <button onClick={handleCheckout} className="btn-primary w-full mt-6">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
