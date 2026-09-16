import React from 'react';

export const StatCard = ({ title, value, icon: Icon, change, changeType = 'positive', color = 'brand', subtitle }) => {
  const colorMap = {
    brand: {
      bg: 'bg-gradient-to-br from-brand-50 to-white',
      border: 'border-brand-200/60',
      iconBg: 'bg-brand-500/10 text-brand-600',
    },
    blue: {
      bg: 'bg-gradient-to-br from-sky-50 to-white',
      border: 'border-sky-200/60',
      iconBg: 'bg-sky-500/10 text-sky-600',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-white',
      border: 'border-amber-200/60',
      iconBg: 'bg-amber-500/10 text-amber-600',
    },
    rose: {
      bg: 'bg-gradient-to-br from-rose-50 to-white',
      border: 'border-rose-200/60',
      iconBg: 'bg-rose-500/10 text-rose-600',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-white',
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
    },
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div className={`p-6 rounded-2xl border ${scheme.border} ${scheme.bg} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-xl ${scheme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 flex items-center text-xs font-semibold">
          <span
            className={`px-2 py-0.5 rounded-full ${
              changeType === 'positive'
                ? 'bg-emerald-100 text-emerald-700'
                : changeType === 'negative'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {change}
          </span>
          <span className="ml-1.5 text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
