import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  FiActivity, FiAlertTriangle, FiArrowUpRight, FiBox, FiCheckCircle,
  FiCompass, FiDollarSign, FiFileText, FiGrid, FiRefreshCw, FiShoppingBag,
  FiUsers, FiWifi,
} from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatPrice } from "../../utils/currency.js";

const StatCard = ({ icon: Icon, label, value, caption, tone = "primary" }) => (
  <article className={`admin-metric-card admin-metric-${tone}`}>
    <div className="flex items-start justify-between gap-3">
      <span className="admin-metric-icon"><Icon /></span>
      <span className="admin-metric-caption">Live</span>
    </div>
    <p className="admin-metric-label">{label}</p>
    <p className="admin-metric-value">{value}</p>
    <p className="admin-metric-foot">{caption}</p>
  </article>
);

const statusTone = {
  Pending: "admin-status-amber",
  Confirmed: "admin-status-blue",
  Processing: "admin-status-violet",
  Shipped: "admin-status-indigo",
  Delivered: "admin-status-green",
  Cancelled: "admin-status-red",
};

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [snapshot, setSnapshot] = useState({ stats: null, lowStock: [], orders: [], pendingPrescriptions: [], health: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setLoadError(false);
    const requests = [
      isAdmin ? api.get("/admin/stats") : Promise.resolve({ data: { stats: null } }),
      api.get("/admin/low-stock"),
      api.get("/orders/admin", { params: { limit: 6 } }),
      api.get("/prescriptions/admin", { params: { status: "Pending" } }),
      api.get("/health"),
    ];
    const [statsResult, lowStockResult, ordersResult, prescriptionResult, healthResult] = await Promise.allSettled(requests);
    const read = (result, fallback) => result.status === "fulfilled" ? result.value.data : fallback;
    if ([statsResult, lowStockResult, ordersResult, prescriptionResult, healthResult].some((result) => result.status === "rejected")) setLoadError(true);
    const stats = read(statsResult, {}).stats || null;
    setSnapshot({
      stats,
      lowStock: read(lowStockResult, {}).products || [],
      orders: read(ordersResult, {}).orders || [],
      pendingPrescriptions: read(prescriptionResult, {}).prescriptions || [],
      health: read(healthResult, null),
    });
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const { stats, lowStock, orders, pendingPrescriptions, health } = snapshot;
  const attentionCount = lowStock.length + pendingPrescriptions.length + orders.filter((order) => order.status === "Pending").length;
  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const salesByDay = stats?.salesByDay || [];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Operations studio</p>
          <h1 className="admin-page-title">Good morning, {isAdmin ? "administrator" : "clinical team"}.</h1>
          <p className="admin-page-subtitle">One calm view of fulfilment, safety checks and the care network.</p>
        </div>
        <div className="admin-page-actions">
          {lastUpdated && <span className="admin-sync-label">Synced {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
          <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary inline-flex items-center gap-2 text-xs">
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh workspace"}
          </button>
        </div>
      </div>

      {loadError && <div className="admin-soft-alert"><FiAlertTriangle /><span>Some live data could not be refreshed. The workspace is showing the latest available snapshot.</span></div>}

      <div className="admin-metric-grid">
        {isAdmin && stats && <>
          <StatCard icon={FiDollarSign} label="Total sales" value={formatPrice(stats.totalSales)} caption="Across fulfilled orders" tone="gold" />
          <StatCard icon={FiShoppingBag} label="Total orders" value={stats.totalOrders} caption={`${orders.filter((item) => item.status === "Pending").length} need confirmation`} tone="blue" />
          <StatCard icon={FiUsers} label="Customers & staff" value={stats.totalUsers} caption="Protected accounts" tone="violet" />
          <StatCard icon={FiBox} label="Live catalogue" value={stats.totalProducts} caption={`${lowStock.length} low-stock alerts`} tone="green" />
        </>}
        {!isAdmin && <>
          <StatCard icon={FiShoppingBag} label="Visible orders" value={orders.length} caption="Latest fulfilment queue" tone="blue" />
          <StatCard icon={FiFileText} label="Prescription queue" value={pendingPrescriptions.length} caption="Awaiting clinical review" tone="gold" />
          <StatCard icon={FiBox} label="Stock watch" value={lowStock.length} caption="Items below threshold" tone="green" />
        </>}
        <article className="admin-health-card">
          <div className="flex items-start justify-between gap-3"><span className="admin-health-icon"><FiWifi /></span><span className="admin-health-dot" /></div>
          <p className="admin-metric-label">Platform health</p>
          <p className="admin-health-title">{health?.status === "healthy" ? "All systems ready" : "Check connection"}</p>
          <p className="admin-metric-foot">SQL Server · secure sessions</p>
        </article>
      </div>

      <div className="admin-workspace-grid">
        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Commercial pulse</p><h2>Sales rhythm</h2></div><span className="admin-panel-chip"><FiActivity /> Last 7 days</span></div>
          {isAdmin && stats ? <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesByDay} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efec" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7c8d89" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7c8d89" }} tickLine={false} axisLine={false} width={46} />
              <Tooltip formatter={(value) => [formatPrice(value), "Sales"]} contentStyle={{ borderRadius: 16, border: "1px solid #e8efec", boxShadow: "0 14px 32px rgba(10,40,40,.12)" }} />
              <Line type="monotone" dataKey="sales" stroke="#bd9650" strokeWidth={3} dot={{ r: 3, fill: "#0a2828", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#0a2828" }} />
            </LineChart>
          </ResponsiveContainer> : <div className="admin-empty-state"><FiActivity /><p>Sales analytics are available to administrators.</p></div>}
        </section>

        <section className="admin-panel admin-attention-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Needs attention</p><h2>Today’s care desk</h2></div><span className="admin-attention-count">{attentionCount}</span></div>
          <div className="admin-attention-list">
            <Link to="/admin/prescriptions" className="admin-attention-row"><span className="admin-attention-icon admin-attention-icon-gold"><FiFileText /></span><span><b>{pendingPrescriptions.length} prescription{pendingPrescriptions.length === 1 ? "" : "s"}</b><small>Awaiting pharmacist review</small></span><FiArrowUpRight /></Link>
            <Link to="/admin/orders" className="admin-attention-row"><span className="admin-attention-icon admin-attention-icon-blue"><FiShoppingBag /></span><span><b>{orders.filter((item) => item.status === "Pending").length} order{orders.filter((item) => item.status === "Pending").length === 1 ? "" : "s"}</b><small>Need confirmation</small></span><FiArrowUpRight /></Link>
            <Link to="/admin/inventory" className="admin-attention-row"><span className="admin-attention-icon admin-attention-icon-red"><FiAlertTriangle /></span><span><b>{lowStock.length} low-stock item{lowStock.length === 1 ? "" : "s"}</b><small>Review replenishment levels</small></span><FiArrowUpRight /></Link>
          </div>
          <div className="admin-safety-callout"><FiCheckCircle /><span>Safety gates are active for prescription products and protected files.</span></div>
        </section>
      </div>

      <div className="admin-lower-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Fulfilment</p><h2>Recent orders</h2></div><Link to="/admin/orders" className="admin-panel-link">View all <FiArrowUpRight /></Link></div>
          {latestOrders.length === 0 ? <div className="admin-empty-state"><FiShoppingBag /><p>No orders in the queue yet.</p></div> : <div className="admin-order-list">{latestOrders.map((order) => <Link key={order._id} to="/admin/orders" className="admin-order-row"><span className="admin-order-avatar">{order.user?.name?.slice(0, 1)?.toUpperCase() || "A"}</span><span className="admin-order-main"><b>{order.user?.name || "Customer"}</b><small>{String(order._id).slice(0, 8).toUpperCase()} · {order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"}</small></span><span className={`admin-status-pill ${statusTone[order.status] || "admin-status-blue"}`}>{order.status}</span><strong>{formatPrice(order.totalPrice)}</strong></Link>)}</div>}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Shortcuts</p><h2>Move with intent</h2></div></div>
          <div className="admin-shortcut-grid">
            {(isAdmin ? [[FiBox, "Products & media", "/admin/products"], [FiGrid, "Categories", "/admin/categories"], [FiUsers, "Customers & staff", "/admin/users"], [FiCompass, "Care directory", "/admin/care-directory"]] : [[FiShoppingBag, "Orders", "/admin/orders"], [FiFileText, "Prescription queue", "/admin/prescriptions"], [FiBox, "Inventory", "/admin/inventory"]]).map(([Icon, label, to]) => <Link key={to} to={to} className="admin-shortcut"><Icon /><span>{label}</span><FiArrowUpRight /></Link>)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
