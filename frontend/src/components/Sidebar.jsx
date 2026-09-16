import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Dog,
  Calendar,
  Home,
  Syringe,
  Stethoscope,
  Scissors,
  Receipt,
  BarChart3,
  UserCheck,
  X,
  Sparkles,
  Globe,
  ExternalLink
} from 'lucide-react';


export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();

  // Navigation config based on roles
  const getNavItems = () => {
    if (isCustomer) {
      return [
        { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/pets', label: 'My Pets', icon: Dog },
        { to: '/appointments', label: 'Bookings & Visits', icon: Calendar },
        { to: '/boarding', label: 'Boarding Requests', icon: Home },
        { to: '/vaccinations', label: 'Vaccination History', icon: Syringe },
        { to: '/billing', label: 'Invoices & Payments', icon: Receipt },
      ];
    }

    if (isStaff && !isAdmin) {
      return [
        { to: '/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
        { to: '/boarding', label: 'Boarding & Kennels', icon: Home },
        { to: '/appointments', label: 'Appointments', icon: Calendar },
        { to: '/medical', label: 'Medical & Feeding', icon: Stethoscope },
        { to: '/pets', label: 'Pet Directory', icon: Dog },
        { to: '/customers', label: 'Customers', icon: Users },
        { to: '/vaccinations', label: 'Vaccinations', icon: Syringe },
        { to: '/billing', label: 'Invoices', icon: Receipt },
      ];
    }

    // Default: Admin (Full CRM access)
    return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/pets', label: 'Pets', icon: Dog },
      { to: '/appointments', label: 'Appointments', icon: Calendar },
      { to: '/boarding', label: 'Boarding & Kennels', icon: Home },
      { to: '/vaccinations', label: 'Vaccinations', icon: Syringe },
      { to: '/medical', label: 'Medical & Daily Care', icon: Stethoscope },
      { to: '/services', label: 'Services Catalog', icon: Scissors },
      { to: '/billing', label: 'Billing & Invoices', icon: Receipt },
      { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar sidebar element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white shadow-sm font-black">
              🐾
            </div>
            <span className="font-extrabold text-white tracking-tight text-base">
              Pet Care <span className="text-brand-400">CRM</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Public Website Link */}
        <div className="px-3 py-2 border-t border-slate-800/80">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-brand-400" />
              <span>Public Website</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>

        {/* Bottom Profile Summary Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                {user?.first_name ? user.first_name[0] : 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
