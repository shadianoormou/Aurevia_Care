import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";

const emptyForm = { name: "", description: "", icon: "", sortOrder: 999, isFeatured: false };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: emptyForm });

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => {
    setEditingId(null);
    reset(emptyForm);
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditingId(category._id);
    reset({
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isFeatured: category.isFeatured,
    });
    setShowForm(true);
  };

  const onSubmit = async (formData) => {
    try {
      if (editingId) {
        await api.put(`/categories/admin/${editingId}`, formData);
        toast.success("Category updated");
      } else {
        await api.post("/categories/admin", formData);
        toast.success("Category created");
      }
      setShowForm(false);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/categories/admin/${deleteTarget._id}`);
      toast.success("Category deleted");
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Category
        </button>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4">Icon</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Visibility</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
                  No categories yet. Click "Add Category" to create one.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c._id} className="border-b border-gray-50">
                  <td className="py-3 px-4 text-xl">{c.icon || "📦"}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{c.name}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{c.description}</td>
                  <td className="py-3 px-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.isFeatured ? "bg-accent-100 text-accent-700" : "bg-slate-100 text-slate-500"}`}>{c.isFeatured ? `Featured · ${c.sortOrder}` : "Standard"}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(c)} className="text-accent-600 hover:text-accent-700">
                        <FiEdit2 />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="text-red-500 hover:text-red-600">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="card w-full max-w-md p-6 my-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input {...register("name", { required: true })} className="input-field mt-1" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea {...register("description")} rows={3} className="input-field mt-1" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Icon (emoji, optional)</label>
                <input {...register("icon")} className="input-field mt-1" placeholder="💊" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600">Sort order</label><input type="number" min="0" {...register("sortOrder")} className="input-field mt-1" /></div>
                <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register("isFeatured")} /> Feature in shop</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </div>
  );
};

export default AdminCategories;
