import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import { formatPrice } from "../../utils/currency.js";

const emptyForm = {
  name: "", brand: "", description: "", category: "", subcategory: "", symptoms: "",
  price: "", stock: "", lowStockThreshold: 10, image: "", requiresPrescription: false,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Selected image file (for real upload) + a local preview URL for it
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({ defaultValues: emptyForm });
  const imageUrlValue = watch("image");
  const selectedCategoryId = watch("category");
  const selectedCategory = categories.find((category) => category._id === selectedCategoryId);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: prodData }, { data: catData }] = await Promise.all([
        api.get("/products", { params: { limit: 100 } }),
        api.get("/categories"),
      ]);
      setProducts(prodData.products);
      setCategories(catData.categories);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
  };

  const openCreate = () => {
    setEditingId(null);
    reset(emptyForm);
    resetImageState();
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    reset({
      name: product.name,
      brand: product.brand,
      description: product.description,
      category: product.category?._id,
      subcategory: product.subcategory?._id || "",
      symptoms: product.symptoms?.join(", "),
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      image: product.image,
      requiresPrescription: product.requiresPrescription,
    });
    resetImageState();
    setShowForm(true);
  };

  // Show a live preview when the admin picks a file, and clean up the
  // temporary object URL when it's no longer needed.
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const onSubmit = async (formData) => {
    try {
      // Always send as multipart/form-data so a real image file upload works.
      // If no file is picked, the "image" text field (URL) is still sent as a fallback.
      const body = new FormData();
      body.append("name", formData.name);
      body.append("brand", formData.brand || "");
      body.append("description", formData.description);
      body.append("category", formData.category);
      if (formData.subcategory) body.append("subcategory", formData.subcategory);
      body.append("price", Number(formData.price));
      body.append("stock", Number(formData.stock));
      body.append("lowStockThreshold", Number(formData.lowStockThreshold || 10));
      body.append("requiresPrescription", !!formData.requiresPrescription);
      body.append("removeImage", removeImage);

      const symptoms = formData.symptoms
        ? formData.symptoms.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : [];
      body.append("symptoms", JSON.stringify(symptoms));

      if (imageFile) {
        body.append("image", imageFile);
      } else if (formData.image) {
        // Fallback: keep/using an image URL if no new file was picked
        body.append("image", formData.image);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingId) {
        await api.put(`/products/admin/${editingId}`, body, config);
        toast.success("Product updated");
      } else {
        await api.post("/products/admin", body, config);
        toast.success("Product created");
      }

      setShowForm(false);
      resetImageState();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/products/admin/${deleteTarget._id}`);
      toast.success("Product deleted");
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Product
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Verified</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800 flex items-center gap-2">
                  <img src={p.image || "https://placehold.co/40x40"} alt="" className="w-8 h-8 rounded object-cover" />
                  {p.name}
                </td>
                <td className="py-3 px-4 text-gray-500">{p.category?.name}</td>
                <td className="py-3 px-4">{formatPrice(p.price)}</td>
                <td className={`py-3 px-4 font-medium ${p.stock <= p.lowStockThreshold ? "text-red-500" : "text-gray-700"}`}>
                  {p.stock}
                </td>
                <td className="py-3 px-4">{p.isVerified ? "✅" : "—"}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(p)} className="text-accent-600 hover:text-accent-700">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="text-red-500 hover:text-red-600">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl p-6 my-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <input {...register("name", { required: true })} className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Brand</label>
                  <input {...register("brand")} className="input-field mt-1" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea {...register("description", { required: true })} rows={3} className="input-field mt-1" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Category</label>
                  <select {...register("category", { required: true })} className="input-field mt-1">
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Symptoms (comma-separated)</label>
                  <input {...register("symptoms")} className="input-field mt-1" placeholder="fever, headache" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Subcategory</label>
                <select {...register("subcategory")} className="input-field mt-1" disabled={!selectedCategory}>
                  <option value="">Select subcategory (optional)</option>
                  {selectedCategory?.subcategories?.map((subcategory) => (
                    <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Price (৳)</label>
                  <input type="number" step="0.01" {...register("price", { required: true })} className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Stock</label>
                  <input type="number" {...register("stock", { required: true })} className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Low Stock Threshold</label>
                  <input type="number" {...register("lowStockThreshold")} className="input-field mt-1" />
                </div>
              </div>

              {/* Real image file upload, with URL fallback */}
              <div>
                <label className="text-sm text-gray-600">Product Image</label>
                <div className="mt-1 flex items-center gap-4">
                  <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                    <FiUpload /> Choose File
                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" />
                  </label>
                  {(imagePreview || (imageUrlValue && !removeImage)) && (
                    <img
                      src={imagePreview || imageUrlValue}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                </div>
                {editingId && imageUrlValue && <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600"><input type="checkbox" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)} /> Remove current image from media storage</label>}
                <p className="text-xs text-gray-400 mt-2">
                  Upload a JPG/PNG/WEBP file (max 5MB), or paste an image URL below as a fallback.
                </p>
                <input
                  {...register("image")}
                  className="input-field mt-2"
                  placeholder="https://... (used only if no file is uploaded)"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register("requiresPrescription")} />
                Requires Prescription
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetImageState(); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </div>
  );
};

export default AdminProducts;
