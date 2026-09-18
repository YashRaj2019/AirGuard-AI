import React from 'react';
import { Info } from 'lucide-react';

export default function PollutantCard({ code, name, value, unit = 'µg/m³', status, statusColor, safeRange, tooltip }) {
  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border border-slate-800">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-base font-bold text-white tracking-wide">{code}</span>
          <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{name}</span>
        </div>
        {status && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${statusColor || '#10b981'}15`,
              color: statusColor || '#10b981',
              borderColor: `${statusColor || '#10b981'}40`,
            }}
          >
            {status}
          </span>
        )}
      </div>

      <div className="my-3 flex items-baseline space-x-1.5">
        <span className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">
          {value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '--'}
        </span>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Safe: {safeRange || 'Standard EPA limit'}</span>
        {tooltip && (
          <div className="relative group cursor-help">
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
            <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200 shadow-xl z-20">
              {tooltip}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
