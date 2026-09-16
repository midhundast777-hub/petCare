import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import {
  Bell,
  Menu,
  User as UserIcon,
  LogOut,
  CheckCheck,
  Shield,
  Briefcase,
  HeartHandshake,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin, isStaff, isCustomer } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(c - 1, 0));
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifications(false);
  };

  const roleLabel = isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Customer';
  const roleBadgeStyle = isAdmin
    ? 'bg-purple-100 text-purple-800 border-purple-200'
    : isStaff
    ? 'bg-sky-100 text-sky-800 border-sky-200'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <span className="text-lg">🐾</span>
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
              PET CARE <span className="text-brand-600">CRM</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Role Badge */}
        <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${roleBadgeStyle}`}>
          {isAdmin && <Shield className="w-3.5 h-3.5" />}
          {isStaff && !isAdmin && <Briefcase className="w-3.5 h-3.5" />}
          {isCustomer && <HeartHandshake className="w-3.5 h-3.5" />}
          {roleLabel}
        </span>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-brand-100 text-brand-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !notif.is_read ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${!notif.is_read ? 'text-brand-900' : 'text-slate-800'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No notifications right now
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                {user?.first_name ? user.first_name[0] : 'U'}
              </div>
            )}
            <div className="hidden md:block text-left text-xs">
              <p className="font-bold text-slate-800 leading-tight">{user?.full_name || user?.email}</p>
              <p className="text-[10px] text-slate-500 capitalize">{roleLabel}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                Profile & Account
              </Link>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
