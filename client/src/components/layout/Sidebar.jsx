import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineBeaker,
  HiOutlineChartPie,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineStatusOnline,
} from 'react-icons/hi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineChartBar },
  { path: '/cylinders', label: 'Cylinders', icon: HiOutlineBeaker },
  { path: '/alerts', label: 'Alerts', icon: HiOutlineBell },
  { path: '/analytics', label: 'Analytics', icon: HiOutlineChartPie },
  { path: '/maintenance', label: 'Maintenance', icon: HiOutlineShieldCheck },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-navy-700/80 backdrop-blur-sm border border-white/10 text-white"
        id="sidebar-toggle"
      >
        {mobileOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-navy-800/95 backdrop-blur-xl border-r border-white/5 z-40
          transition-all duration-300 flex flex-col
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
            <HiOutlineStatusOnline className="text-white text-xl" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-white tracking-tight">GasGuard</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Detection System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            // Role check: operators can't access settings
            if (item.path === '/settings' && user?.role === 'operator') return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                id={`nav-${item.label.toLowerCase()}`}
              >
                <Icon size={22} className={isActive ? 'text-electric-400' : ''} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-electric-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'operator'}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            id="logout-btn"
          >
            <HiOutlineLogout size={20} />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-white/5 text-gray-500 hover:text-white transition-colors"
          id="sidebar-collapse"
        >
          <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}
