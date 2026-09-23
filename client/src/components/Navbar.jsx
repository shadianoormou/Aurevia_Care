import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiGrid, FiFileText, FiCompass } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import VoiceSearchButton from "./VoiceSearchButton.jsx";

const Navbar = () => {
  const { user, logout, isAdmin, isPharmacist } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const search = (value) => {
    const phrase = value.trim();
    if (!phrase) return;
    navigate(`/products?keyword=${encodeURIComponent(phrase)}`);
    setQuery("");
    setMenuOpen(false);
  };

  const handleSearch = (event) => { event.preventDefault(); search(query); };
  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <header className="bg-white/95 backdrop-blur border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Aurevia Care home">
          <img src="/aurevia-mark.svg" alt="" className="w-10 h-10" />
          <span className="font-extrabold tracking-tight text-lg text-primary-900 hidden sm:block">Aurevia <span className="text-accent-600">Care</span></span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search care essentials or a symptom…" className="w-full border border-slate-200 rounded-full pl-4 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <VoiceSearchButton onResult={search} className="absolute right-9 top-1/2 -translate-y-1/2 p-2" />
            <button type="submit" aria-label="Search" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-primary-700 hover:text-primary-900"><FiSearch /></button>
          </div>
        </form>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/products" className="text-sm font-semibold text-slate-600 hover:text-primary-700">Shop</Link>
          <Link to="/care" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary-700"><FiCompass /> Care guide</Link>
          {user && <Link to="/prescriptions" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary-700"><FiFileText /> Prescriptions</Link>}
          {(isAdmin || isPharmacist) && <Link to="/admin/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary-700"><FiGrid /> Workspace</Link>}
          <Link to="/cart" aria-label="Cart" className="relative text-primary-800 hover:text-primary-900">
            <FiShoppingCart size={22} />
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-accent-500 text-primary-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
          </Link>
          {user ? <div className="flex items-center gap-3"><Link to="/profile" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary-700"><FiUser /> {user.name.split(" ")[0]}</Link><button onClick={handleLogout} className="text-slate-400 hover:text-red-500" aria-label="Log out"><FiLogOut size={18} /></button></div> : <Link to="/login" className="btn-primary text-sm">Sign in</Link>}
        </div>
        <button className="md:hidden text-2xl text-primary-900" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <FiX /> : <FiMenu />}</button>
      </div>

      {menuOpen && <div className="md:hidden border-t border-slate-100 px-4 py-4 space-y-3 bg-white">
        <form onSubmit={handleSearch} className="relative"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines…" className="input-field pr-12 text-sm" /><VoiceSearchButton onResult={search} className="absolute right-2 top-1/2 -translate-y-1/2 p-2" /></form>
        <Link to="/products" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Shop</Link>
        <Link to="/care" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Bangladesh care guide</Link>
        <Link to="/cart" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Cart ({cartCount})</Link>
        {user && <Link to="/prescriptions" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Prescriptions</Link>}
        {(isAdmin || isPharmacist) && <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Workspace</Link>}
        {user ? <><Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Profile</Link><Link to="/my-orders" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-slate-700">Orders</Link><button onClick={handleLogout} className="block text-sm font-semibold text-red-600">Log out</button></> : <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary inline-block text-sm">Sign in</Link>}
      </div>}
    </header>
  );
};

export default Navbar;
