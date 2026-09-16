import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reportService } from '../services/reportService';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  Dog,
  Calendar,
  Home,
  AlertTriangle,
  Receipt,
  DollarSign,
  TrendingUp,
  PlusCircle,
  LogIn,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const Dashboard = () => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, chartRes] = await Promise.all([
          reportService.getSummary(),
          reportService.getCharts(),
        ]);
        setSummary(sumRes);
        setCharts(chartRes);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Loading CRM dashboard insights..." />;

  // Customer view vs Admin/Staff view
  if (isCustomer || summary?.is_customer) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-teal-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 uppercase tracking-widest text-brand-100 border border-white/20">
              Customer Sanctuary Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Welcome back, {user?.first_name || 'Pet Parent'}! 🐾
            </h1>
            <p className="text-brand-100 text-sm mt-1">
              Track your pet's wellness schedule, upcoming boarding reservations, and medical records in real time.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/appointments"
                className="px-4 py-2 bg-white text-brand-800 rounded-xl font-bold text-xs shadow hover:bg-brand-50 transition-colors"
              >
                Book Appointment
              </Link>
              <Link
                to="/pets"
                className="px-4 py-2 bg-brand-800/40 text-white rounded-xl font-bold text-xs border border-white/30 hover:bg-brand-800/60 transition-colors"
              >
                View My Pets
              </Link>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Registered Pets"
            value={summary?.total_pets || 0}
            icon={Dog}
            color="brand"
          />
          <StatCard
            title="Upcoming Bookings"
            value={summary?.upcoming_appointments || 0}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Boarding Stays"
            value={summary?.active_boardings || 0}
            icon={Home}
            color="amber"
          />
          <StatCard
            title="Pending Invoices"
            value={`$${summary?.unpaid_balance || '0.00'}`}
            subtitle={`${summary?.pending_invoices || 0} unpaid invoices`}
            icon={Receipt}
            color="rose"
          />
        </div>
      </div>
    );
  }

  const COLORS = ['#0D9488', '#0284C7', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>CRM Executive Dashboard</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics for pet health, kennel occupancy, bookings & revenue
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/appointments"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Appointment</span>
          </Link>
          <Link
            to="/boarding"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Boarding & Check-In</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={summary?.total_customers || 0}
          icon={Users}
          change={`+${summary?.new_customers_this_month || 0} new`}
          changeType="positive"
          color="brand"
        />
        <StatCard
          title="Total Pets"
          value={summary?.total_pets || 0}
          icon={Dog}
          color="blue"
          subtitle="Registered in system"
        />
        <StatCard
          title="Today's Appointments"
          value={summary?.today_appointments || 0}
          icon={Calendar}
          subtitle={`${summary?.upcoming_appointments || 0} upcoming scheduled`}
          color="amber"
        />
        <StatCard
          title="Boarding Occupancy"
          value={`${summary?.occupancy_rate || 0}%`}
          subtitle={`${summary?.occupied_rooms || 0} of ${summary?.total_rooms || 0} rooms occupied`}
          icon={Home}
          color="emerald"
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Expiring / Expired Vaccines"
          value={summary?.vaccinations_expiring_soon || 0}
          subtitle={`${summary?.vaccinations_expired || 0} expired alerts`}
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Pending Invoices"
          value={summary?.pending_invoices_count || 0}
          subtitle="Awaiting customer payment"
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(summary?.monthly_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`Today: $${(summary?.today_revenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="brand"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Revenue Trend</h3>
              <p className="text-[11px] text-slate-400">Total collected revenue over the last 6 months</p>
            </div>
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthly_revenue || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Appointment Status Distribution</h3>
              <p className="text-[11px] text-slate-400">Volume by current booking status</p>
            </div>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.appointment_stats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(charts?.appointment_stats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Popularity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Most Popular Services</h3>
              <p className="text-[11px] text-slate-400">Services ranked by appointment frequency</p>
            </div>
          </div>
          <div className="space-y-3">
            {(charts?.service_popularity || []).slice(0, 5).map((srv, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 font-extrabold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{srv.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{srv.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-900">{srv.bookings} bookings</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">${srv.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent CRM Activity</h3>
              <p className="text-[11px] text-slate-400">Live feed of bookings, stays, and check-ins</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {(summary?.recent_activities || []).map((act) => (
              <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600 mt-0.5">
                    {act.type === 'APPOINTMENT' ? <Calendar className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{act.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {act.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(act.time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
