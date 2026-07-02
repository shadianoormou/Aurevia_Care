import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";

// Used by both Admin and Pharmacist/Manager roles to manage stock levels
// and verify medicine/product information.
const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { limit: 100 } });
      setProducts(data.products);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleStockChange = (id, value) => {
    setEditValues((prev) => ({ ...prev, [id]: value }));
  };

  const saveStock = async (id) => {
    const newStock = editValues[id];
    if (newStock === undefined || newStock === "") return;

    try {
      await api.put(`/products/admin/${id}/stock`, { stock: Number(newStock) });
      toast.success("Stock updated");
      setEditValues((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const toggleVerify = async (product) => {
    setVerifyingId(product._id);
    try {
      await api.put(`/products/admin/${product._id}/verify`, { isVerified: !product.isVerified });
      toast.success(product.isVerified ? "Product unverified" : "Product verified");
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification update failed");
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
      <p className="text-sm text-gray-500 mb-6">
        Update stock levels and verify medicine/product information. Rows highlighted in red
        are at or below their low-stock threshold.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Current Stock</th>
              <th className="py-3 px-4">Threshold</th>
              <th className="py-3 px-4">Update Stock</th>
              <th className="py-3 px-4">Verification</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLow = p.stock <= p.lowStockThreshold;
              return (
                <tr key={p._id} className={`border-b border-gray-50 ${isLow ? "bg-red-50" : ""}`}>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {p.name}
                    {p.requiresPrescription && (
                      <span className="ml-2 text-[11px] text-accent-700 bg-accent-50 px-2 py-0.5 rounded">Rx</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.category?.name}</td>
                  <td className={`py-3 px-4 font-semibold ${isLow ? "text-red-600" : "text-gray-700"}`}>{p.stock}</td>
                  <td className="py-3 px-4 text-gray-500">{p.lowStockThreshold}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder={p.stock}
                        value={editValues[p._id] ?? ""}
                        onChange={(e) => handleStockChange(p._id, e.target.value)}
                        className="input-field w-24 text-sm py-1"
                      />
                      <button onClick={() => saveStock(p._id)} className="btn-primary text-xs px-3 py-1.5">
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleVerify(p)}
                      disabled={verifyingId === p._id}
                      className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                        p.isVerified
                          ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p.isVerified ? <FiCheckCircle /> : <FiXCircle />}
                      {p.isVerified ? "Verified" : "Unverified"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
