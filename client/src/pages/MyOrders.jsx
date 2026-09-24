import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiCheck, FiChevronDown, FiClock, FiMapPin, FiPackage, FiRefreshCw, FiTruck } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import { formatPrice } from "../utils/currency.js";

const STATUS_STEPS = [
  { status: "Pending", label: "Received", icon: FiClock },
  { status: "Confirmed", label: "Confirmed", icon: FiCheck },
  { status: "Processing", label: "Preparing", icon: FiPackage },
  { status: "Shipped", label: "On the way", icon: FiTruck },
  { status: "Delivered", label: "Delivered", icon: FiCheck },
];

const STATUS_COLORS = {
  Pending: "admin-status-amber",
  Confirmed: "admin-status-blue",
  Processing: "admin-status-violet",
  Shipped: "admin-status-indigo",
  Delivered: "admin-status-green",
  Cancelled: "admin-status-red",
};

const MyOrders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openOrder, setOpenOrder] = useState(location.state?.newOrderId || null);

  const loadOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get("/orders/my-orders");
      setOrders(data.orders || []);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  const counts = useMemo(() => orders.reduce((accumulator, order) => {
    accumulator[order.status] = (accumulator[order.status] || 0) + 1;
    return accumulator;
  }, {}), [orders]);

  if (loading) return <Loader fullScreen />;

  if (error) return <div className="max-w-xl mx-auto px-4 py-24 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><FiRefreshCw /></span><h1 className="font-display text-3xl text-primary-900 mt-5">Your orders are taking a moment.</h1><p className="text-sm leading-6 text-slate-500 mt-2">We could not reach the order service. Your account is safe—try again in a moment.</p><button onClick={loadOrders} className="btn-primary mt-6 inline-flex items-center gap-2"><FiRefreshCw /> Retry</button></div>;

  if (orders.length === 0) return <div className="max-w-xl mx-auto px-4 py-24 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><FiPackage /></span><p className="eyebrow mt-6">Your private care history</p><h1 className="font-display text-3xl text-primary-900 mt-2">No orders yet.</h1><p className="text-sm leading-6 text-slate-500 mt-2">Your placed orders, prescription fulfilment and delivery progress will appear here.</p><Link to="/products" className="btn-primary inline-flex mt-6">Start shopping</Link></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8"><div><p className="eyebrow">Private care history</p><h1 className="font-display text-4xl text-primary-900 mt-2">Your orders</h1><p className="text-sm text-slate-500 mt-2">Every fulfilment step, in one considered view.</p></div><div className="flex gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-500"><span className="rounded-full bg-primary-50 px-3 py-2">{orders.length} total</span>{counts.Pending > 0 && <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-800">{counts.Pending} pending</span>}</div></div>

      <div className="space-y-5">{orders.map((order) => {
        const currentIndex = STATUS_STEPS.findIndex((step) => step.status === order.status);
        const isOpen = openOrder === order._id;
        const isCancelled = order.status === "Cancelled";
        return <article key={order._id} className={`rounded-3xl border bg-white p-5 shadow-sm transition sm:p-6 ${location.state?.newOrderId === order._id ? "border-primary-400 ring-4 ring-primary-100" : "border-primary-100"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-accent-700">Order {String(order._id).slice(0, 8).toUpperCase()}</p><p className="mt-1 text-xs text-slate-400">Placed {new Date(order.createdAt).toLocaleDateString()} · {order.paymentMethod}</p></div><span className={`admin-status-pill ${STATUS_COLORS[order.status] || "admin-status-blue"}`}>{order.status}</span></div>

          <div className="order-progress mt-7">{STATUS_STEPS.map((step, index) => { const Icon = step.icon; const complete = !isCancelled && currentIndex >= index; return <div key={step.status} className={`order-progress-step ${complete ? "order-progress-step-complete" : ""}`}><span className="order-progress-icon"><Icon /></span><small>{step.label}</small>{index < STATUS_STEPS.length - 1 && <i className={complete && currentIndex > index ? "order-progress-line-complete" : ""} />}</div>; })}</div>
          {isCancelled && <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">This order was cancelled. If you need help, contact Aurevia Care support before placing a new order.</div>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-primary-50 pt-4"><div className="flex items-center gap-2 text-xs text-slate-500"><FiMapPin className="text-primary-500" /> {order.shippingAddress?.city}, {order.shippingAddress?.country}</div><div className="flex items-center gap-4"><strong className="text-lg text-primary-900">{formatPrice(order.totalPrice)}</strong><button onClick={() => setOpenOrder(isOpen ? null : order._id)} className="inline-flex items-center gap-1 text-xs font-extrabold text-primary-700">{isOpen ? "Hide details" : "View details"}<FiChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} /></button></div></div>

          {isOpen && <div className="mt-4 grid gap-5 border-t border-primary-50 pt-5 md:grid-cols-[1fr_.8fr]"><div><p className="eyebrow">Items in this order</p><div className="mt-2 divide-y divide-primary-50">{order.items.map((item, index) => <div key={`${item.product || item._id || item.name}-${index}`} className="flex justify-between gap-3 py-2 text-sm text-slate-600"><span>{item.name} × {item.quantity}</span><span className="font-semibold text-primary-900">{formatPrice(item.price * item.quantity)}</span></div>)}</div></div><div className="rounded-2xl bg-primary-50 p-4"><p className="eyebrow">Delivery address</p><p className="mt-2 text-sm font-semibold text-primary-900">{order.shippingAddress?.fullName}</p><p className="mt-1 text-xs leading-5 text-slate-600">{order.shippingAddress?.street}<br />{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />{order.shippingAddress?.phone}</p>{order.statusHistory?.length > 0 && <div className="mt-4 border-t border-primary-100 pt-3"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-primary-600">Latest activity</p><p className="mt-1 text-xs text-slate-600">{new Date(order.statusHistory[order.statusHistory.length - 1].changedAt).toLocaleString()} · {order.statusHistory[order.statusHistory.length - 1].status}</p></div>}</div></div>}
        </article>;
      })}</div>
    </div>
  );
};

export default MyOrders;
