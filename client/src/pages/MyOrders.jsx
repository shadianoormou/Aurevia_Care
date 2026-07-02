import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import { formatPrice } from "../utils/currency.js";

const STATUS_COLORS = {
  Pending: "bg-gray-100 text-gray-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-purple-100 text-purple-700",
  Delivered: "bg-primary-100 text-primary-700",
  Cancelled: "bg-red-100 text-red-700",
};

const MyOrders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/orders/my-orders");
        setOrders(data.orders);
      } catch (error) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader fullScreen />;

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-800">No orders yet</h2>
        <p className="text-gray-500 mt-2">Your placed orders will appear here.</p>
        <Link to="/products" className="btn-primary inline-block mt-6">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className={`card p-5 ${location.state?.newOrderId === order._id ? "ring-2 ring-primary-400" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-gray-400">Order ID</p>
                <p className="text-sm font-mono text-gray-700">{order._id}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div className="mt-3 divide-y divide-gray-50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm text-gray-600">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Placed on {new Date(order.createdAt).toLocaleDateString()} · {order.paymentMethod}
              </span>
              <span className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
