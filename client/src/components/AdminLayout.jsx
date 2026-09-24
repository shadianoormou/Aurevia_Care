import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity, FiArrowUpRight, FiBox, FiChevronRight, FiCompass, FiFileText,
  FiGrid, FiHome, FiLogOut, FiMenu, FiPackage, FiSettings, FiShoppingBag,
  FiShield, FiUsers, FiX,
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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
            <button className="admin-settings" onClick={() => setSettingsOpen(true)} aria-label="Workspace settings"><FiSettings /></button>
          </div>
        </header>
        <main className="admin-main-content">{children}</main>
      </div>
      {settingsOpen && <>
        <button className="admin-settings-scrim" onClick={() => setSettingsOpen(false)} aria-label="Close workspace settings" />
        <aside className="admin-settings-drawer" aria-label="Workspace settings panel">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Workspace settings</p><h2 className="font-display text-2xl text-primary-900 mt-1">Aurevia control room</h2></div><button onClick={() => setSettingsOpen(false)} className="admin-drawer-close" aria-label="Close settings"><FiX /></button></div>
          <div className="admin-drawer-section"><p className="admin-drawer-label">Signed-in operator</p><div className="admin-drawer-identity"><span className="admin-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "A"}</span><span><b>{user?.name || "Administrator"}</b><small>{user?.email || "Protected account"}</small></span></div></div>
          <div className="admin-drawer-section"><p className="admin-drawer-label">Workspace safeguards</p><div className="admin-drawer-check"><FiActivity /><span><b>Live data connection</b><small>SQL Server and secure session cookies are active.</small></span><i /></div><div className="admin-drawer-check"><FiShield /><span><b>Role-protected controls</b><small>{isAdmin ? "Full administrator controls are enabled." : "Clinical workflow controls are enabled."}</small></span><i /></div></div>
          <div className="admin-drawer-section"><p className="admin-drawer-label">Quick routes</p><Link to="/admin/orders" onClick={() => setSettingsOpen(false)} className="admin-drawer-link">Open fulfilment queue <FiArrowUpRight /></Link><Link to="/admin/prescriptions" onClick={() => setSettingsOpen(false)} className="admin-drawer-link">Open prescription queue <FiArrowUpRight /></Link><Link to="/" onClick={() => setSettingsOpen(false)} className="admin-drawer-link">View customer storefront <FiArrowUpRight /></Link></div>
          <p className="admin-drawer-note">Settings are intentionally read-only in this workspace. Secrets, credentials and production configuration stay outside the browser.</p>
        </aside>
      </>}
    </div>
  );
};

export default AdminLayout;
