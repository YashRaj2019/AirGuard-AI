import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { airGuardApi } from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { Layers, ShieldCheck, AlertCircle, Info, Activity, Sparkles, ArrowRight } from 'lucide-react';

export default function Pollutants({ selectedCity }) {
  const navigate = useNavigate();
  const [pollutants, setPollutants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPollutants(selectedCity);
  }, [selectedCity]);

  const loadPollutants = async (city) => {
    try {
      setLoading(true);
      const res = await airGuardApi.getPollutants(city);
      setPollutants(res.data || []);
    } catch (err) {
      console.error('Failed to load pollutants:', err);
    } finally {
      setLoading(false);
    }
  };

  const barData = pollutants.map((p) => ({
    name: p.code,
    contribution: p.relativeContribution || 10,
    subIndex: p.subIndex || 0,
    color: p.statusColor || '#10b981',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Atmospheric Chemistry & Toxicology</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Criteria Pollutant Drill-Down: {selectedCity}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Comprehensive physiological, chemical, and concentration assessment of the primary ambient pollutants defined by the US EPA and World Health Organization.
            </p>
          </div>

          <button
            id="btn-inspect-pollutants-dashboard"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 via-emerald-400 to-cyan-400 hover:from-brand-400 hover:to-cyan-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Inspect Live {selectedCity} AQI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-64" />
          <LoadingSkeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Relative Impact Overview Chart */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">Relative Model & Environmental Contribution (%)</h3>
            <p className="text-xs text-slate-400 mb-6">Normalized feature contribution to ambient AQI degradation</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 60]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Relative Weight']}
                  />
                  <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Pollutant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pollutants.map((p) => (
              <div key={p.code} className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-white">{p.code}</span>
                      <span className="text-xs text-slate-400 font-medium">({p.name})</span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${p.statusColor}15`,
                        borderColor: `${p.statusColor}40`,
                        color: p.statusColor,
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2 mb-3">
                    <span className="text-3xl font-extrabold text-white font-sans">
                      {p.currentValue != null ? p.currentValue.toFixed(1) : '--'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{p.unit}</span>
                    <span className="text-xs text-slate-500 ml-auto">
                      Sub-Index: <strong className="text-slate-300">{Math.round(p.subIndex)}</strong>
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-2">
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="font-semibold text-slate-300">Safe Baseline Range: </span>
                      <span>{p.safeReferenceRange}</span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed pt-1">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-start space-x-1.5 text-rose-300/80">
                    <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                    <span><strong className="text-rose-200">Health Impact:</strong> {p.healthEffects}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Reference Standards Breakdown Table */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 overflow-x-auto">
            <h3 className="text-base font-bold text-white mb-2">US EPA Clean Air Act Categorization Breakpoints</h3>
            <p className="text-xs text-slate-400 mb-4">Official sub-index breakpoint standards used across the AirGuard platform</p>
            
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">AQI Range</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">PM2.5 (24h)</th>
                  <th className="py-2.5 px-4">PM10 (24h)</th>
                  <th className="py-2.5 px-4">NO2 (1h)</th>
                  <th className="py-2.5 px-4">Color Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-emerald-400">0 - 50</td>
                  <td className="py-2.5 px-4 font-medium">Good</td>
                  <td className="py-2.5 px-4">0.0 - 12.0 µg/m³</td>
                  <td className="py-2.5 px-4">0 - 54 µg/m³</td>
                  <td className="py-2.5 px-4">0 - 53 µg/m³</td>
                  <td className="py-2.5 px-4"><span className="w-4 h-4 rounded-full bg-emerald-500 inline-block" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-amber-400">51 - 100</td>
                  <td className="py-2.5 px-4 font-medium">Moderate</td>
                  <td className="py-2.5 px-4">12.1 - 35.4 µg/m³</td>
                  <td className="py-2.5 px-4">55 - 154 µg/m³</td>
                  <td className="py-2.5 px-4">54 - 100 µg/m³</td>
                  <td className="py-2.5 px-4"><span className="w-4 h-4 rounded-full bg-amber-400 inline-block" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-orange-400">101 - 150</td>
                  <td className="py-2.5 px-4 font-medium">Unhealthy for Sensitive</td>
                  <td className="py-2.5 px-4">35.5 - 55.4 µg/m³</td>
                  <td className="py-2.5 px-4">155 - 254 µg/m³</td>
                  <td className="py-2.5 px-4">101 - 360 µg/m³</td>
                  <td className="py-2.5 px-4"><span className="w-4 h-4 rounded-full bg-orange-500 inline-block" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-rose-400">151 - 200</td>
                  <td className="py-2.5 px-4 font-medium">Unhealthy</td>
                  <td className="py-2.5 px-4">55.5 - 150.4 µg/m³</td>
                  <td className="py-2.5 px-4">255 - 354 µg/m³</td>
                  <td className="py-2.5 px-4">361 - 649 µg/m³</td>
                  <td className="py-2.5 px-4"><span className="w-4 h-4 rounded-full bg-rose-500 inline-block" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-purple-400">201 - 300</td>
                  <td className="py-2.5 px-4 font-medium">Very Unhealthy</td>
                  <td className="py-2.5 px-4">150.5 - 250.4 µg/m³</td>
                  <td className="py-2.5 px-4">355 - 424 µg/m³</td>
                  <td className="py-2.5 px-4">650 - 1249 µg/m³</td>
                  <td className="py-2.5 px-4"><span className="w-4 h-4 rounded-full bg-purple-500 inline-block" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-violet-300">301 - 500+</td>
                  <td className="py-2.5 px-4 font-medium">Hazardous</td>
                  <td className="py-2.5 px-4">&ge; 250.5 µg/m³</td>
                  <td className="py-2.5 px-4">&ge; 425 µg/m³</td>
                  <td className="py-2.5 px-4">&ge; 1250 µg/m³</td>
                  <td className="py-2.5 px-4"><span className="w-4 h-4 rounded-full bg-purple-900 inline-block" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
