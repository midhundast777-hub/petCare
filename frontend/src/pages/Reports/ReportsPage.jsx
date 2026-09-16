import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Home,
  CheckCircle,
  FileText,
  Printer
} from 'lucide-react';
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
  Cell
} from 'recharts';

export const ReportsPage = () => {
  const { addToast } = useToast();
  const [charts, setCharts] = useState(null);
  const [detailed, setDetailed] = useState(null);
  const [loading, setLoading] = useState(true);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [chartData, detailData] = await Promise.all([
        reportService.getCharts(),
        reportService.getDetailed({ start_date: startDate, end_date: endDate }),
      ]);
      setCharts(chartData);
      setDetailed(detailData);
    } catch (err) {
      console.error(err);
      addToast('Failed to load analytical reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  if (loading) return <LoadingSpinner size="lg" text="Generating CRM executive reports..." />;

  const COLORS = ['#0D9488', '#0284C7', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <span>Business Analytics & Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Financial revenue breakdowns, service popularity, occupancy rates, and operational trends
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Date-Range Filter Bar */}
      <form onSubmit={handleApplyFilter} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>Analysis Period:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 text-[11px]">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 text-[11px]">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          Update Report Data
        </button>
      </form>

      {/* Financial KPIs for Selected Range */}
      {detailed?.revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              ${detailed.revenue.total_collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Paid receipts in range</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ${detailed.revenue.total_invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Gross billed amount</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              ${detailed.revenue.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">{detailed.revenue.pending_invoices_count} pending invoices</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Appointments</p>
            <h3 className="text-2xl font-black text-sky-700 mt-1">
              {detailed.appointments?.total || 0}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">{detailed.appointments?.completed || 0} completed</p>
          </div>
        </div>
      )}

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6-Month Revenue Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Semi-Annual Revenue Growth</h3>
            <p className="text-[11px] text-slate-400">Gross customer collections by month</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthly_revenue || []}>
                <defs>
                  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val) => [`$${val.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#areaColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Growth by Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">New Customer Registrations</h3>
            <p className="text-[11px] text-slate-400">Client acquisition rate over time</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.customer_growth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => [val, 'New Customers']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="new_customers" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Services Breakdown Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Top Performing Care Services</h3>
          <p className="text-[11px] text-slate-400">Service ranking by client bookings and revenue contributions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500 bg-slate-50/60">
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Bookings Count</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(charts?.service_popularity || []).map((srv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">{srv.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {srv.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{srv.bookings}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">${srv.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
