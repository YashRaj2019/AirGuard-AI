import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { airGuardApi } from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  History as HistoryIcon, Star, Trash2, ArrowRight, ExternalLink,
  Calendar, Cpu, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function History({ selectedCity, onSelectCity }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [favRes, predRes] = await Promise.all([
        airGuardApi.getFavorites().catch(() => ({ data: [] })),
        airGuardApi.getPredictionHistory(20).catch(() => ({ data: [] })),
      ]);
      setFavorites(favRes.data || []);
      setPredictionHistory(predRes.data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (cityName) => {
    try {
      await airGuardApi.removeFavorite(cityName);
      setFavorites((prev) => prev.filter((f) => f.name !== cityName));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <HistoryIcon className="w-4 h-4" />
          <span>User Persistence & Prediction Audit Log</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Favorites & Forecast History
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Review saved monitoring stations and audit previous machine learning predictions stored in PostgreSQL.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-64" />
      ) : (
        <>
          {/* Favorites Section */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-lg font-bold text-white">Bookmarked Cities</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {favorites.length} {favorites.length === 1 ? 'Station' : 'Stations'} Saved
              </span>
            </div>

            {favorites.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                <Star className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-300 font-medium">No favorite cities saved yet</p>
                <p className="text-xs text-slate-500">
                  Click the star icon on the main dashboard to bookmark monitoring stations for quick access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favorites.map((city) => (
                  <div
                    key={city.id}
                    onClick={() => {
                      onSelectCity(city.name);
                      navigate('/');
                    }}
                    className="p-4 bg-slate-900/80 hover:bg-slate-850 cursor-pointer rounded-xl border border-slate-800 hover:border-brand-500/40 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">{city.name}</h4>
                      <p className="text-xs text-slate-400">{city.state ? `${city.state}, ` : ''}{city.country}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-brand-400 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(city.name);
                        }}
                        className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                        title="Remove Favorite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predictions Audit Log Table */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">ML Forecast Audit History</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Persisted in PostgreSQL (predictions table)</span>
            </div>

            {predictionHistory.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                No past predictions logged. Run a prediction on the Forecast page to generate audit logs.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Target Forecast Horizon</th>
                    <th className="py-3 px-4">Predicted AQI</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Model Architecture</th>
                    <th className="py-3 px-4">Primary Factor</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {predictionHistory.map((pred, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{pred.city}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {pred.predictionTime ? new Date(pred.predictionTime).toLocaleString() : 'Next 24h'}
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-400 text-sm">
                        {Math.round(pred.predictedAqi)} AQI
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800 text-slate-300 border-slate-700">
                          {pred.aqiCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{pred.modelName}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {pred.contributingFactors?.[0]?.feature || 'PM2.5'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            onSelectCity(pred.city);
                            navigate('/forecast');
                          }}
                          className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

    </div>
  );
}
