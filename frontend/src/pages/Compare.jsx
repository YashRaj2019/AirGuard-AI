import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { airGuardApi } from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { GitCompare, Brain, Sparkles, Trophy, ArrowRight, Activity, Thermometer, Wind } from 'lucide-react';

export default function Compare({ cities = [], selectedCity, onSelectCity }) {
  const navigate = useNavigate();
  const [city1, setCity1] = useState(selectedCity || 'Delhi');
  const [city2, setCity2] = useState('Mumbai');
  const [city3, setCity3] = useState('London');
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    runComparison();
  }, [city1, city2, city3]);

  const runComparison = async () => {
    try {
      setLoading(true);
      const res = await airGuardApi.compareCities(city1, city2, city3);
      setCompareData(res.data);
      setAiAnalysis(res.data?.aiComparisonAnalysis);
    } catch (err) {
      console.error('Failed to compare cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    try {
      setExplaining(true);
      const prompt = `Provide an in-depth environmental health comparison between ${city1}, ${city2}, and ${city3}. Analyze differences in particulate matter (PM2.5/PM10), gaseous emissions, and atmospheric wind dispersion. Highlight actionable insights for residents.`;
      const res = await airGuardApi.aiChat({
        question: prompt,
        selectedCity: city1,
        contextData: {
          comparedCities: compareData?.cities?.map(c => ({
            city: c.cityName,
            aqi: c.aqi,
            category: c.aqiCategory,
            pm25: c.pm25,
            pm10: c.pm10,
            wind: c.windSpeed
          }))
        }
      });
      setAiAnalysis(res.data?.response);
    } catch (err) {
      console.error('Failed to get AI comparison explanation:', err);
    } finally {
      setExplaining(false);
    }
  };

  // Format bar chart data
  const comparisonChartData = compareData?.cities?.map((c) => ({
    name: c.cityName,
    AQI: c.aqi,
    'PM2.5 (µg/m³)': c.pm25,
    'PM10 (µg/m³)': c.pm10,
    'NO2 (µg/m³)': c.no2,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header & City Selectors */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <GitCompare className="w-4 h-4" />
          <span>Regional Multi-Station Analytics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Multi-City Air Quality Comparator
        </h1>
        <p className="text-sm text-slate-400 mt-1 mb-6">
          Compare criteria pollutants, atmospheric conditions, and machine learning forecasts across global urban centers.
        </p>

        {/* City Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">First City</label>
            <select
              value={city1}
              onChange={(e) => setCity1(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3.5 py-2 font-medium focus:ring-2 focus:ring-brand-500"
            >
              {cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.country})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Second City</label>
            <select
              value={city2}
              onChange={(e) => setCity2(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3.5 py-2 font-medium focus:ring-2 focus:ring-brand-500"
            >
              {cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.country})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Third City (Optional)</label>
            <select
              value={city3}
              onChange={(e) => setCity3(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3.5 py-2 font-medium focus:ring-2 focus:ring-brand-500"
            >
              {cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.country})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-96" />
      ) : (
        <>
          {/* Winner / Summary Banner */}
          {compareData?.cleanerCity && (
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Cleanest Ambient Air</span>
                    <span className="text-xs text-slate-400">• {compareData.aqiDifference} AQI Spread</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {compareData.cleanerCity} maintains the cleanest atmospheric quality
                  </h3>
                </div>
              </div>

              <button
                onClick={handleAskAI}
                disabled={explaining}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all shrink-0 shadow-lg shadow-purple-500/10"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span>{explaining ? 'Analyzing with AI...' : 'Ask AI to Explain Comparison'}</span>
              </button>
            </div>
          )}

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {compareData?.cities?.map((city, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{city.cityName}</h3>
                      <p className="text-xs text-slate-400">{city.country}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${city.categoryColor}15`,
                        borderColor: `${city.categoryColor}40`,
                        color: city.categoryColor,
                      }}
                    >
                      {city.aqiCategory}
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline space-x-2">
                    <span className="text-5xl font-extrabold text-white font-sans" style={{ color: city.categoryColor }}>
                      {city.aqi}
                    </span>
                    <span className="text-xs text-slate-400">AQI</span>
                  </div>

                  <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">PM2.5:</span>
                      <span className="font-semibold text-white">{city.pm25?.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">PM10:</span>
                      <span className="font-semibold text-white">{city.pm10?.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">NO2:</span>
                      <span className="font-semibold text-white">{city.no2?.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Wind Velocity:</span>
                      <span className="font-semibold text-white">{city.windSpeed?.toFixed(1)} km/h</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="font-semibold text-white">{city.temperature?.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Forecast (+24h):</span>
                      <span className="font-bold text-brand-400">{Math.round(city.predictedAqi)} AQI</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Dominant: <strong className="text-slate-300">{city.primaryPollutant || 'PM2.5'}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCity) onSelectCity(city.cityName);
                    navigate('/');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full mt-2 py-2 bg-slate-800/80 hover:bg-brand-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 hover:border-brand-400 flex items-center justify-center space-x-1.5 transition-all shadow-sm group cursor-pointer"
                >
                  <span>Inspect {city.cityName} on Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          {/* Grouped Bar Chart Comparison */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">Cross-City Atmospheric Pollutant Comparison</h3>
            <p className="text-xs text-slate-400 mb-6">Normalized criteria concentrations across stations</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="AQI" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PM2.5 (µg/m³)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PM10 (µg/m³)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NO2 (µg/m³)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grounded AI Comparison Analysis Card */}
          {aiAnalysis && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 bg-gradient-to-r from-slate-900/90 to-purple-950/20">
              <div className="flex items-center space-x-2 text-purple-400">
                <Brain className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Comparative Environmental Analysis</h3>
                <span className="text-[10px] font-semibold bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">
                  Grounded AI Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                {aiAnalysis}
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
