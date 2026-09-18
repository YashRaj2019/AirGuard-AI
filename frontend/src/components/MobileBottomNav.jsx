import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, TrendingUp, Layers, GitCompare, Bot, Sparkles } from 'lucide-react';

export default function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/forecast', label: 'Forecast', icon: TrendingUp },
    { to: '/pollutants', label: 'Pollutants', icon: Layers },
    { to: '/compare', label: 'Compare', icon: GitCompare },
    { to: '/advisory', label: 'Ask AI', icon: Bot, highlight: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 min-w-[56px] min-h-[44px] ${
                  isActive
                    ? 'text-brand-400 bg-brand-500/15 font-bold shadow-sm shadow-brand-500/10'
                    : item.highlight
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
