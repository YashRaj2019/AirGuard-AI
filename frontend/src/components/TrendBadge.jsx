import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TrendBadge({ trend = 'stable', percentage }) {
  const isUp = trend === 'increasing';
  const isDown = trend === 'decreasing';

  const color = isUp
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : isDown
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const label = isUp ? 'Deteriorating (+AQI)' : isDown ? 'Improving (-AQI)' : 'Stable Baseline';

  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {percentage != null && (
        <span className="opacity-80">({percentage > 0 ? `+${percentage}%` : `${percentage}%`})</span>
      )}
    </span>
  );
}
