import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiTrash2 } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";

const ROLES = ["customer", "pharmacist", "admin"];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.users);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}`, { role });
      toast.success("Role updated");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? "User deactivated" : "User activated");
      loadUsers();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      toast.success("User deleted");
      setDeleteTarget(null);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                <td className="py-3 px-4 text-gray-500">{u.email}</td>
                <td className="py-3 px-4">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="input-field text-sm w-36"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${u.isActive ? "bg-primary-100 text-primary-700" : "bg-red-100 text-red-600"}`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => setDeleteTarget(u)} className="text-red-500 hover:text-red-600">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </div>
  );
};

export default AdminUsers;
