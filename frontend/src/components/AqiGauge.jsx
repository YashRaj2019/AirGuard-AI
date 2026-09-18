import React from 'react';

export default function AqiGauge({ aqi = 0, category = 'Moderate', color = '#10B981', size = 220, subtitle = 'Current Air Quality' }) {
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // AQI max standard is 500
  const normalizedAqi = Math.max(0, Math.min(500, aqi));
  const strokeDashoffset = circumference - (normalizedAqi / 500) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-800/80"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 10px ${color}40)`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            US EPA AQI
          </span>
          <span 
            className="text-5xl font-extrabold tracking-tight font-sans"
            style={{ color: color }}
          >
            {Math.round(aqi)}
          </span>
          <span 
            className="mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-sm"
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}40`,
              color: color,
            }}
          >
            {category}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs font-medium text-slate-400">{subtitle}</p>
    </div>
  );
}
