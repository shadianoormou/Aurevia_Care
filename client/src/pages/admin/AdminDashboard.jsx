import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiGrid, FiCompass } from "react-icons/fi";
import { FiFileText } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatPrice } from "../../utils/currency.js";

const StatCard = ({ icon, label, value }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = [api.get("/admin/low-stock")];
        if (isAdmin) requests.unshift(api.get("/admin/stats"));

        const results = await Promise.all(requests);

        if (isAdmin) {
          setStats(results[0].data.stats);
          setLowStock(results[1].data.products);
        } else {
          setLowStock(results[0].data.products);
        }
      } catch (error) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {isAdmin && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FiDollarSign />} label="Total Sales" value={formatPrice(stats.totalSales)} />
            <StatCard icon={<FiShoppingBag />} label="Total Orders" value={stats.totalOrders} />
            <StatCard icon={<FiUsers />} label="Total Users" value={stats.totalUsers} />
            <StatCard icon={<FiPackage />} label="Total Products" value={stats.totalProducts} />
          </div>

          <div className="card p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Sales — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#0e9260" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin && (
          <>
            <Link to="/admin/products" className="card p-5 hover:shadow-md transition-shadow">
              <FiPackage className="text-primary-600 text-xl mb-2" />
              <p className="font-medium text-gray-900 text-sm">Manage Products</p>
            </Link>
            <Link to="/admin/categories" className="card p-5 hover:shadow-md transition-shadow">
              <FiGrid className="text-primary-600 text-xl mb-2" />
              <p className="font-medium text-gray-900 text-sm">Manage Categories</p>
            </Link>
            <Link to="/admin/users" className="card p-5 hover:shadow-md transition-shadow">
              <FiUsers className="text-primary-600 text-xl mb-2" />
              <p className="font-medium text-gray-900 text-sm">Manage Users</p>
            </Link>
            <Link to="/admin/care-directory" className="card p-5 hover:shadow-md transition-shadow">
              <FiCompass className="text-primary-600 text-xl mb-2" />
              <p className="font-medium text-gray-900 text-sm">Care Directory</p>
            </Link>
          </>
        )}
        <Link to="/admin/orders" className="card p-5 hover:shadow-md transition-shadow">
          <FiShoppingBag className="text-primary-600 text-xl mb-2" />
          <p className="font-medium text-gray-900 text-sm">Manage Orders</p>
        </Link>
        <Link to="/admin/inventory" className="card p-5 hover:shadow-md transition-shadow">
          <FiAlertTriangle className="text-primary-600 text-xl mb-2" />
          <p className="font-medium text-gray-900 text-sm">Inventory</p>
        </Link>
        <Link to="/admin/prescriptions" className="card p-5 hover:shadow-md transition-shadow">
          <FiFileText className="text-primary-600 text-xl mb-2" />
          <p className="font-medium text-gray-900 text-sm">Prescription Queue</p>
        </Link>
      </div>

      {/* Low stock warning */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiAlertTriangle className="text-amber-500" />
          <h2 className="font-semibold text-gray-900">Low Stock Alerts ({lowStock.length})</h2>
        </div>

        {lowStock.length === 0 ? (
          <p className="text-sm text-gray-500">All products are sufficiently stocked. ✅</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2">Product</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-800">{p.name}</td>
                    <td className="py-2 text-gray-500">{p.category?.name}</td>
                    <td className="py-2 text-red-500 font-semibold">{p.stock}</td>
                    <td className="py-2 text-gray-500">{p.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
