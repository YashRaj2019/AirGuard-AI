import React from 'react';

export default function LoadingSkeleton({ className = 'h-32' }) {
  return (
    <div className={`w-full rounded-xl bg-slate-900/60 animate-pulse border border-slate-800/80 ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-slate-800/40 to-transparent animate-shimmer" />
    </div>
  );
}
