import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertTriangle, FiMail, FiRefreshCw, FiSearch } from "react-icons/fi";
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
  const [search, setSearch] = useState("");

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
      const { data } = await api.put(`/orders/admin/${orderId}/status`, { status });
      if (data.notification?.sent) toast.success("Status updated — customer email sent");
      else if (data.notification?.reason === "no_email") toast.success("Status updated — account has no email");
      else toast.success("Status updated — email delivery is not configured");
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  if (loading) return <Loader fullScreen />;

  const visibleOrders = orders.filter((order) => {
    const phrase = search.trim().toLowerCase();
    if (!phrase) return true;
    return [order._id, order.user?.name, order.user?.email, order.shippingAddress?.city]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(phrase));
  });
  const pendingCount = orders.filter((order) => order.status === "Pending").length;
  const fulfilmentCount = orders.filter((order) => ["Confirmed", "Processing", "Shipped"].includes(order.status)).length;
  const deliveredCount = orders.filter((order) => order.status === "Delivered").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-7 flex-wrap gap-4">
        <div><p className="eyebrow">Fulfilment control</p><h1 className="font-display text-3xl text-primary-900 mt-1">Order command centre</h1><p className="text-sm text-slate-500 mt-2">Move every order through a traceable, customer-aware workflow.</p></div>
        <button onClick={loadOrders} className="btn-secondary inline-flex items-center gap-2 text-xs"><FiRefreshCw /> Refresh queue</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[{ label: "Total queue", value: orders.length, tone: "bg-primary-50 text-primary-800" }, { label: "Needs confirmation", value: pendingCount, tone: "bg-amber-50 text-amber-800" }, { label: "In fulfilment", value: fulfilmentCount, tone: "bg-blue-50 text-blue-800" }, { label: "Delivered", value: deliveredCount, tone: "bg-emerald-50 text-emerald-800" }].map((metric) => <div key={metric.label} className={`rounded-2xl border border-white px-4 py-4 shadow-sm ${metric.tone}`}><p className="text-[10px] font-extrabold uppercase tracking-[.14em] opacity-70">{metric.label}</p><p className="font-display text-3xl mt-1">{metric.value}</p></div>)}
      </div>

      <div className="catalog-toolbar mb-5">
        <label className="relative flex-1 min-w-[15rem]"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer or city…" className="input-field pl-9 text-sm" /></label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-48 text-sm"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      </div>

      <div className="space-y-4">
        {visibleOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders found.</p>
        ) : visibleOrders.map((order) => (
          <div key={order._id} className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-accent-700">Order {String(order._id).slice(0, 8).toUpperCase()}</p>
                <p className="text-xs font-mono text-gray-400 mt-1">{order._id}</p>
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
              <span className="font-bold text-gray-900 inline-flex items-center gap-2">{order.user?.email && <FiMail className="text-primary-500" title="Email available" />} {formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
