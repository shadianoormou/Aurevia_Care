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
import NotFound from "./pages/NotFound.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminCategories from "./pages/admin/AdminCategories.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
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

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
