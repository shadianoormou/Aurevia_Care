import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import PrescriptionCenter from "./pages/PrescriptionCenter.jsx";
import CareGuide from "./pages/CareGuide.jsx";
import NotFound from "./pages/NotFound.jsx";

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.jsx"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory.jsx"));
const AdminPrescriptions = lazy(() => import("./pages/admin/AdminPrescriptions.jsx"));
const AdminCareDirectory = lazy(() => import("./pages/admin/AdminCareDirectory.jsx"));

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="py-20 text-center text-sm text-primary-700">Loading your workspace…</div>}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer protected */}
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionCenter /></ProtectedRoute>} />
          <Route path="/care" element={<CareGuide />} />

          {/* Admin / Pharmacist protected */}
          <Route
            path="/admin/dashboard"
            element={<AdminRoute roles={["admin", "pharmacist"]}><AdminDashboard /></AdminRoute>}
          />
          <Route
            path="/admin/products"
            element={<AdminRoute roles={["admin"]}><AdminProducts /></AdminRoute>}
          />
          <Route
            path="/admin/categories"
            element={<AdminRoute roles={["admin"]}><AdminCategories /></AdminRoute>}
          />
          <Route
            path="/admin/orders"
            element={<AdminRoute roles={["admin", "pharmacist"]}><AdminOrders /></AdminRoute>}
          />
          <Route
            path="/admin/users"
            element={<AdminRoute roles={["admin"]}><AdminUsers /></AdminRoute>}
          />
          <Route
            path="/admin/inventory"
            element={<AdminRoute roles={["admin", "pharmacist"]}><AdminInventory /></AdminRoute>}
          />
          <Route
            path="/admin/prescriptions"
            element={<AdminRoute roles={["admin", "pharmacist"]}><AdminPrescriptions /></AdminRoute>}
          />
          <Route
            path="/admin/care-directory"
            element={<AdminRoute roles={["admin"]}><AdminCareDirectory /></AdminRoute>}
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
