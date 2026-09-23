import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiGrid, FiFileText, FiCompass } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import VoiceSearchButton from "./VoiceSearchButton.jsx";

const Navbar = () => {
  const { user, logout, isAdmin, isPharmacist } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
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
  const navLinkClass = ({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`;
  const mobileLinkClass = ({ isActive }) => `mobile-nav-link ${isActive ? "mobile-nav-link-active" : ""}`;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand-lockup" aria-label="Aurevia Care home">
          <img src="/aurevia-mark.svg" alt="" className="brand-mark" />
          <span className="brand-copy"><span className="brand-name">Aurevia <em>Care</em></span><span className="brand-subtitle">Private pharmacy · Bangladesh</span></span>
        </Link>

        <form onSubmit={handleSearch} className="nav-search hidden lg:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search care essentials or a symptom…" className="w-full border border-slate-200 rounded-full pl-4 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <VoiceSearchButton onResult={search} className="absolute right-9 top-1/2 -translate-y-1/2 p-2" />
            <button type="submit" aria-label="Search" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-primary-700 hover:text-primary-900"><FiSearch /></button>
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
          <NavLink to="/products" className={navLinkClass}>Shop</NavLink>
          <NavLink to="/care" className={navLinkClass}><FiCompass /> <span>Care</span><span className="hidden xl:inline"> guide</span></NavLink>
          {user && <NavLink to="/prescriptions" className={navLinkClass}><FiFileText /> <span className="hidden xl:inline">Prescriptions</span><span className="xl:hidden">Rx</span></NavLink>}
          {(isAdmin || isPharmacist) && <NavLink to="/admin/dashboard" className={navLinkClass}><FiGrid /> <span className="hidden xl:inline">Workspace</span><span className="xl:hidden">Work</span></NavLink>}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <Link to="/cart" aria-label="Cart" className={`nav-icon-button relative ${location.pathname === "/cart" ? "nav-icon-button-active" : ""}`}>
            <FiShoppingCart size={22} />
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-accent-500 text-primary-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
          </Link>
          {user ? <div className="flex items-center gap-2"><NavLink to="/profile" className={navLinkClass}><FiUser /> <span>{user.name.split(" ")[0]}</span></NavLink><button onClick={handleLogout} className="nav-icon-button text-slate-400 hover:text-red-500" aria-label="Log out"><FiLogOut size={18} /></button></div> : <Link to="/login" className="nav-signin">Sign in <span aria-hidden="true">↗</span></Link>}
        </div>
        <button className="mobile-menu-toggle md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <FiX /> : <FiMenu />}</button>
      </div>

      {menuOpen && <div className="mobile-menu md:hidden">
        <div className="mobile-menu-inner">
          <form onSubmit={handleSearch} className="relative mb-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines…" className="input-field pr-12 text-sm" /><VoiceSearchButton onResult={search} className="absolute right-2 top-1/2 -translate-y-1/2 p-2" /></form>
          <p className="mobile-menu-label">Navigate</p>
          <NavLink to="/products" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Shop</span><span>01</span></NavLink>
          <NavLink to="/care" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Bangladesh care guide</span><span>02</span></NavLink>
          <NavLink to="/cart" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Cart <small>({cartCount})</small></span><span>03</span></NavLink>
          {user && <NavLink to="/prescriptions" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Prescriptions</span><span>04</span></NavLink>}
          {(isAdmin || isPharmacist) && <NavLink to="/admin/dashboard" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Workspace</span><span>05</span></NavLink>}
          {user ? <><NavLink to="/profile" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Profile</span><span>06</span></NavLink><NavLink to="/my-orders" onClick={() => setMenuOpen(false)} className={mobileLinkClass}><span>Orders</span><span>07</span></NavLink><button onClick={handleLogout} className="mobile-logout">Log out</button></> : <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-signin w-full justify-center mt-3">Sign in <span aria-hidden="true">↗</span></Link>}
        </div>
      </div>}
    </header>
  );
};

export default Navbar;
