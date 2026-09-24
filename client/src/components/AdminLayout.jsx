import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity, FiArrowUpRight, FiBox, FiChevronRight, FiCompass, FiFileText,
  FiGrid, FiHome, FiLogOut, FiMenu, FiPackage, FiSettings, FiShoppingBag,
  FiUsers, FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";

const primaryLinks = [
  { to: "/admin/dashboard", label: "Overview", icon: FiHome, roles: ["admin", "pharmacist"] },
  { to: "/admin/orders", label: "Orders", icon: FiShoppingBag, roles: ["admin", "pharmacist"] },
  { to: "/admin/prescriptions", label: "Prescription queue", icon: FiFileText, roles: ["admin", "pharmacist"] },
  { to: "/admin/inventory", label: "Inventory", icon: FiBox, roles: ["admin", "pharmacist"] },
];

const adminLinks = [
  { to: "/admin/products", label: "Products & media", icon: FiPackage },
  { to: "/admin/categories", label: "Categories", icon: FiGrid },
  { to: "/admin/users", label: "Customers & staff", icon: FiUsers },
  { to: "/admin/care-directory", label: "Care directory", icon: FiCompass },
];

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [...primaryLinks, ...(isAdmin ? adminLinks : [])];
  const closeMenu = () => setMobileOpen(false);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) => `admin-nav-link ${isActive ? "admin-nav-link-active" : ""}`;

  return (
    <div className="admin-app-shell">
      {mobileOpen && <button className="admin-sidebar-scrim" onClick={closeMenu} aria-label="Close navigation" />}
      <aside className={`admin-sidebar ${mobileOpen ? "admin-sidebar-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Link to="/admin/dashboard" onClick={closeMenu} className="admin-brand-lockup">
            <img src="/aurevia-mark.svg" alt="" className="admin-brand-mark" />
            <span><strong>Aurevia</strong> <em>Care</em><small>Operations studio</small></span>
          </Link>
          <button className="admin-mobile-close" onClick={closeMenu} aria-label="Close navigation"><FiX /></button>
        </div>

        <div className="admin-sidebar-scroll">
          <p className="admin-nav-caption">Command centre</p>
          <nav className="admin-sidebar-nav" aria-label="Admin navigation">
            {links.map(({ to, label, icon: Icon, roles }) => {
              if (roles && !roles.includes(user?.role)) return null;
              return <NavLink key={to} to={to} onClick={closeMenu} className={linkClass}>
                <Icon /><span>{label}</span>{location.pathname === to && <FiChevronRight className="admin-nav-chevron" />}
              </NavLink>;
            })}
          </nav>

          <p className="admin-nav-caption admin-nav-caption-spaced">Manage the network</p>
          <div className="admin-sidebar-note">
            <FiActivity />
            <div><strong>Live safeguards</strong><span>Source-aware care and stock controls are active.</span></div>
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-store-link" onClick={closeMenu}><FiArrowUpRight /> View storefront</Link>
          <button onClick={handleLogout} className="admin-logout"><FiLogOut /> Sign out</button>
        </div>
      </aside>

      <div className="admin-main-column">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><FiMenu /></button>
            <div className="admin-breadcrumbs"><span>Workspace</span><FiChevronRight /><strong>{links.find((link) => location.pathname === link.to)?.label || "Overview"}</strong></div>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-live-pill"><i /> Live workspace</span>
            <div className="admin-user-chip"><span className="admin-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "A"}</span><span><b>{user?.name || "Administrator"}</b><small>{user?.role || "admin"}</small></span></div>
            <button className="admin-settings" aria-label="Workspace settings"><FiSettings /></button>
          </div>
        </header>
        <main className="admin-main-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
