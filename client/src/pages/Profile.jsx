import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      zipCode: user?.address?.zipCode || "",
      country: user?.address?.country || "",
      password: "",
    },
  });

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const { name, phone, password, ...address } = formData;
      const payload = { name, phone, address };
      if (password) payload.password = password;

      const { data } = await api.put("/auth/profile", payload);
      updateUser(data.user);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-600">Email (cannot be changed)</label>
          <input value={user?.email} disabled className="input-field mt-1 bg-gray-50 text-gray-400" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <input {...register("name")} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <input {...register("phone")} className="input-field mt-1" />
          </div>
        </div>

        <h2 className="font-semibold text-gray-900 pt-2 border-t border-gray-100">Address</h2>
        <div>
          <label className="text-sm text-gray-600">Street</label>
          <input {...register("street")} className="input-field mt-1" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">City</label>
            <input {...register("city")} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-sm text-gray-600">State</label>
            <input {...register("state")} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Zip Code</label>
            <input {...register("zipCode")} className="input-field mt-1" />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">Country</label>
          <input {...register("country")} className="input-field mt-1" />
        </div>

        <h2 className="font-semibold text-gray-900 pt-2 border-t border-gray-100">Change Password</h2>
        <div>
          <label className="text-sm text-gray-600">New Password (leave blank to keep current)</label>
          <input type="password" {...register("password")} className="input-field mt-1" />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
