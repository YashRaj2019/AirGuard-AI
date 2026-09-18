import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Globe, Loader2, Plus, Sparkles, Check } from 'lucide-react';
import { airGuardApi } from '../api/client';

export default function CitySearchModal({ isOpen, onClose, onCitySelected }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingCity, setAddingCity] = useState(null);
  const [error, setError] = useState(null);

  const POPULAR_SUGGESTIONS = [
    { name: 'Tokyo', country: 'Japan', countryCode: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
    { name: 'Paris', country: 'France', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
    { name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
    { name: 'Sydney', country: 'Australia', countryCode: 'AU', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
    { name: 'San Francisco', country: 'United States', state: 'California', countryCode: 'US', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
    { name: 'Jaipur', country: 'India', state: 'Rajasthan', countryCode: 'IN', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' },
    { name: 'Singapore', country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setAddingCity(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await airGuardApi.searchCities(query.trim());
        if (res.data) {
          setResults(res.data);
        }
      } catch (err) {
        setError('Could not search cities. Please check connectivity.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = async (item) => {
    setAddingCity(item.name);
    setError(null);
    try {
      const res = await airGuardApi.addCity({
        name: item.name,
        state: item.state || '',
        country: item.country || 'Global',
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'UTC'
      });

      if (res.data) {
        onCitySelected(res.data);
        onClose();
      }
    } catch (err) {
      setError(`Failed to sync telemetry for ${item.name}: ${err.message}`);
    } finally {
      setAddingCity(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Worldwide City Search</h2>
              <p className="text-xs text-slate-400">Search any location to ingest Copernicus atmospheric telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, town or state (e.g. Pune, Chicago, Tokyo, Jaipur)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Popular:
            </span>
            {POPULAR_SUGGESTIONS.map((city) => (
              <button
                key={city.name}
                onClick={() => handleSelect(city)}
                disabled={addingCity !== null}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-slate-700/60 hover:border-brand-500/40 transition-colors disabled:opacity-50"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 min-h-[220px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm">Searching global coordinate database...</p>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && results.length === 0 && query.trim().length >= 2 && !error && (
            <div className="text-center py-10 text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">No locations matched "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching a larger nearby city or alternate spelling</p>
            </div>
          )}

          {!loading && results.length === 0 && query.trim().length < 2 && (
            <div className="text-center py-10 text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-medium text-slate-300">Track air quality anywhere on Earth</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Type any municipality or click a popular city chip above to ingest live European Copernicus CAMS telemetry and run ML forecasts.
              </p>
            </div>
          )}

          {!loading && results.map((item, idx) => (
            <div
              key={`${item.name}-${item.latitude}-${idx}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 transition-all duration-150 group"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-500/10 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    {item.countryCode && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.countryCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {[item.state, item.country].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Lat: {item.latitude.toFixed(3)}°, Lon: {item.longitude.toFixed(3)}°
                    {item.population ? ` • Pop: ${(item.population / 1000).toFixed(0)}k` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSelect(item)}
                disabled={addingCity !== null}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-slate-950 border border-brand-500/30 hover:border-brand-500 text-xs font-semibold transition-all duration-150 shadow-sm disabled:opacity-50"
              >
                {addingCity === item.name ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Track AQI</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Powered by Open-Meteo & Copernicus CAMS</span>
          <span className="text-brand-400 font-medium">Automatic ML & Advisory Integration</span>
        </div>

      </div>
    </div>
  );
}
