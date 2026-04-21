import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = "bg-white" }) => {
  return (
    <div className={`${color} border border-[#e5e5e5] rounded-3xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-black">{value}</p>
        </div>
        {icon && (
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={`text-xs font-bold ${trend.isUp ? 'text-success' : 'text-urgent'}`}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400 font-medium tracking-tight">vs last week</span>
        </div>
      )}
    </div>
  );
};
