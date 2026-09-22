import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiAlertTriangle } from "react-icons/fi";
import api from "../api/axios.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice } from "../utils/currency.js";

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [prescriptionAcknowledged, setPrescriptionAcknowledged] = useState(false);
  const [approvedPrescriptions, setApprovedPrescriptions] = useState([]);
  const [prescriptionId, setPrescriptionId] = useState("");

  const hasPrescriptionItems = cartItems.some((item) => item.requiresPrescription);

  useEffect(() => {
    if (!hasPrescriptionItems) return;
    api.get("/prescriptions/my")
      .then(({ data }) => setApprovedPrescriptions(data.prescriptions.filter((prescription) => prescription.status === "Approved" && (!prescription.expiresAt || new Date(prescription.expiresAt) > new Date()))))
      .catch(() => setApprovedPrescriptions([]));
  }, [hasPrescriptionItems]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user?.name || "",
      phone: user?.phone || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      zipCode: user?.address?.zipCode || "",
      country: user?.address?.country || "",
      paymentMethod: "COD",
    },
  });

  const shipping = cartTotal > 500 ? 0 : 50;
  const tax = Number((cartTotal * 0.05).toFixed(2));
  const total = Number((cartTotal + shipping + tax).toFixed(2));

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link to="/products" className="btn-primary inline-block mt-4">Browse Products</Link>
      </div>
    );
  }

  const onSubmit = async (formData) => {
    if (hasPrescriptionItems && !prescriptionAcknowledged) {
      toast.error("Please acknowledge the prescription notice before placing your order");
      return;
    }
    if (hasPrescriptionItems && !prescriptionId) {
      toast.error("Choose an approved prescription before placing this order");
      return;
    }

    setPlacing(true);
    try {
      const { paymentMethod, ...shippingAddress } = formData;

      const { data } = await api.post("/orders", {
        items: cartItems.map((item) => ({ product: item._id, quantity: item.quantity })),
        shippingAddress,
        paymentMethod,
        prescriptionAcknowledged,
        prescriptionId: hasPrescriptionItems ? prescriptionId : undefined,
      });

      clearCart();
      toast.success("Order placed successfully!");
      navigate("/my-orders", { state: { newOrderId: data.order._id } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Shipping Address</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input {...register("fullName", { required: "Required" })} className="input-field mt-1" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input {...register("phone", { required: "Required" })} className="input-field mt-1" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Street Address</label>
            <input {...register("street", { required: "Required" })} className="input-field mt-1" />
            {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">City</label>
              <input {...register("city", { required: "Required" })} className="input-field mt-1" />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600">State</label>
              <input {...register("state")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Zip Code</label>
              <input {...register("zipCode")} className="input-field mt-1" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Country</label>
            <input {...register("country")} className="input-field mt-1" />
          </div>

          <h2 className="font-semibold text-gray-900 pt-4 border-t border-gray-100">Payment Method</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" value="COD" {...register("paymentMethod")} defaultChecked />
              Cash on Delivery
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
              <input type="radio" value="Stripe" {...register("paymentMethod")} disabled />
              Card Payment (Stripe) — coming soon
            </label>
          </div>

          {hasPrescriptionItems && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-start gap-3 bg-accent-50 text-accent-700 text-sm rounded-lg px-4 py-3">
                <FiAlertTriangle className="shrink-0 mt-0.5" />
                <p>
                  Your order contains prescription-required medicine. By placing this
                  order you confirm that you have a valid prescription for these items.
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700 mt-3">
                <input
                  type="checkbox"
                  checked={prescriptionAcknowledged}
                  onChange={(e) => setPrescriptionAcknowledged(e.target.checked)}
                  className="mt-1"
                />
                I confirm I have a valid prescription for the medicine in this order.
              </label>
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700">Approved prescription</label>
                {approvedPrescriptions.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    You need an approved prescription before checkout. <Link to="/prescriptions" className="font-bold underline">Upload a scan or enter it manually</Link>.
                  </div>
                ) : (
                  <select value={prescriptionId} onChange={(event) => setPrescriptionId(event.target.value)} className="input-field mt-1">
                    <option value="">Select an approved prescription</option>
                    {approvedPrescriptions.map((prescription) => <option key={prescription._id} value={prescription._id}>{prescription.doctorName || "Verified prescription"} · submitted {new Date(prescription.createdAt).toLocaleDateString()}</option>)}
                  </select>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 border-t border-gray-100 pt-4">
            ⚠️ This platform does not provide medical advice. Please consult a doctor or
            pharmacist before taking any medicine.
          </p>
        </div>

        {/* Order summary */}
        <div className="card p-6 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item._id} className="flex justify-between text-sm text-gray-600">
                <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatPrice(tax)}</span></div>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
          <button
            type="submit"
            disabled={placing || (hasPrescriptionItems && (!prescriptionAcknowledged || !prescriptionId))}
            className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
