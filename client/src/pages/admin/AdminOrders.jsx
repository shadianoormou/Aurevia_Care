import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertTriangle } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatPrice } from "../../utils/currency.js";

const STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  Pending: "bg-gray-100 text-gray-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-purple-100 text-purple-700",
  Delivered: "bg-primary-100 text-primary-700",
  Cancelled: "bg-red-100 text-red-700",
};

const AdminOrders = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/admin", { params: { status: statusFilter || undefined, limit: 50 } });
      setOrders(data.orders);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const changeStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/admin/${orderId}/status`, { status });
      toast.success("Order status updated");
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-48 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders found.</p>
        ) : orders.map((order) => (
          <div key={order._id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400">Order ID</p>
                <p className="text-sm font-mono text-gray-700">{order._id}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {order.user?.name} · {order.user?.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {order.containsPrescriptionItems && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-accent-100 text-accent-700">
                    <FiAlertTriangle /> Rx
                  </span>
                )}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
                {isAdmin && (
                  <select
                    value={order.status}
                    onChange={(e) => changeStatus(order._id, e.target.value)}
                    className="input-field text-sm w-40"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="mt-3 divide-y divide-gray-50 text-sm text-gray-600">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500">
                {order.shippingAddress?.city}, {order.shippingAddress?.country} · {order.paymentMethod}
              </span>
              <span className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
