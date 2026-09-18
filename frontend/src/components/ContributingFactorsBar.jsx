import React from 'react';
import { Cpu, AlertCircle } from 'lucide-react';

export default function ContributingFactorsBar({ factors = [], modelName = 'ML Regression' }) {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 glass-panel rounded-xl">
        No factor importance attribution available for this prediction.
      </div>
    );
  }

  // Normalize importance to sum or max
  const maxImportance = Math.max(...factors.map(f => f.importance || 0), 1);

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-200">Major Model Contributing Factors</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Model: {modelName}</span>
      </div>

      <div className="space-y-3">
        {factors.map((factor, idx) => {
          const widthPct = Math.min(100, Math.max(8, (factor.importance / maxImportance) * 100));
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">{factor.feature}</span>
                <span className="text-brand-400 font-semibold">{factor.importance.toFixed(1)}% influence</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-300">{factors[0]?.feature || 'PM2.5'}</span> has the strongest statistical influence on this model's prediction. Factor weights reflect feature importance in the regression model, not direct environmental causality.
        </p>
      </div>
    </div>
  );
}
