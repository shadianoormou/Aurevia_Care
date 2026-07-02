import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiGrid } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const Navbar = () => {
  const { user, logout, isAdmin, isPharmacist } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/medimart-logo.svg"
            alt="MediMart AI Logo"
            className="w-10 h-10 rounded-xl"
          />

          <span className="font-bold text-lg text-gray-900 hidden sm:block">
            MediMart <span className="text-primary-600">AI</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicines, or symptoms like 'fever'..."
              className="w-full border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600">
              <FiSearch />
            </button>
          </div>
        </form>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-primary-600">
            Products
          </Link>

          {(isAdmin || isPharmacist) && (
            <Link to="/admin/dashboard" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary-600">
              <FiGrid /> Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/categories" className="text-sm font-medium text-gray-600 hover:text-primary-600">
              Categories
            </Link>
          )}

          <Link to="/cart" className="relative text-gray-600 hover:text-primary-600">
            <FiShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary-600">
                <FiUser /> {user.name.split(" ")[0]}
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500" title="Logout">
                <FiLogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm">
              Login
            </Link>
          )}
        </div>

        <button className="md:hidden text-2xl text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 px-4 py-4 space-y-3 bg-white">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicines..."
              className="input-field text-sm"
            />
          </form>
          <Link to="/products" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">
            Products
          </Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">
            Cart ({cartCount})
          </Link>
          {(isAdmin || isPharmacist) && (
            <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/categories" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">
              Categories
            </Link>
          )}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">
                Profile
              </Link>
              <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">
                My Orders
              </Link>
              <button onClick={handleLogout} className="block text-sm font-medium text-red-500">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary inline-block text-sm">
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
