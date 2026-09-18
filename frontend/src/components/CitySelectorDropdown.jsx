import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Search, Sparkles, Check, ArrowRight, ExternalLink } from 'lucide-react';

export default function CitySelectorDropdown({ selectedCity, onSelectCity, cities = [] }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setFilterQuery('');
    }
  }, [isOpen]);

  const handleCitySelect = (cityName) => {
    if (onSelectCity) {
      onSelectCity(cityName);
    }
    setIsOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (c.country && c.country.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const activeCityObj = cities.find((c) => c.name === selectedCity) || { name: selectedCity, country: 'Global' };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Main Dropdown Trigger Button - Never overflows & beautifully styled */}
      <button
        id="btn-city-dropdown"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Active Station: ${selectedCity}. Click to switch station or inspect live AQI on Dashboard.`}
        className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none text-left shrink-0 ${
          isOpen
            ? 'bg-slate-900 border-brand-500/60 shadow-lg shadow-brand-500/10 ring-2 ring-brand-500/20'
            : 'bg-slate-900/90 hover:bg-slate-850 text-slate-200 border-slate-700/80 hover:border-slate-600 shadow-inner'
        }`}
      >
        <div className="relative flex items-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="absolute -inset-0.5 rounded-full bg-emerald-400/40 animate-ping" />
        </div>

        <div className="flex items-baseline space-x-1 min-w-0 max-w-[65px] sm:max-w-[80px] xl:max-w-[100px]">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
            {selectedCity}
          </span>
          {activeCityObj.country && (
            <span className="text-[10px] text-slate-400 truncate hidden 2xl:inline">
              ({activeCityObj.country.slice(0, 3)})
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-brand-400' : 'group-hover:text-white'
          }`}
        />
      </button>

      {/* Glassmorphic Animated Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-950/95 border border-slate-700/90 shadow-2xl p-3 z-50 backdrop-blur-2xl animate-scale-in">
          
          {/* Header Action: Jump directly to Dashboard for current city */}
          <button
            type="button"
            onClick={() => handleCitySelect(selectedCity)}
            className="w-full flex items-center justify-between p-2.5 mb-2.5 rounded-xl bg-gradient-to-r from-brand-500/15 via-emerald-500/10 to-transparent border border-brand-500/30 hover:border-brand-500/60 text-left transition-all group"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                  Inspect {selectedCity} on Dashboard
                </p>
                <p className="text-[10px] text-slate-400">Generate fresh 24h forecast & telemetry</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-brand-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Search Filter Input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search station or country..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500"
            />
          </div>

          {/* Station List */}
          <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            {filteredCities.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No matching stations found
              </div>
            ) : (
              filteredCities.map((city) => {
                const isCurrent = city.name.toLowerCase() === selectedCity.toLowerCase();
                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handleCitySelect(city.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left ${
                      isCurrent
                        ? 'bg-brand-500/15 border border-brand-500/40 text-white shadow-sm'
                        : 'hover:bg-slate-900/80 border border-transparent text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800/80 text-slate-400'}`}>
                        <MapPin className="w-3 h-3 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-brand-300' : 'text-slate-200'}`}>
                          {city.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {city.state ? `${city.state}, ` : ''}{city.country || 'Global Station'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {isCurrent ? (
                        <span className="flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Inspect &rarr;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>{cities.length} Global Stations Live</span>
            <span className="text-brand-400 font-mono">Copernicus CAMS</span>
          </div>

        </div>
      )}
    </div>
  );
}
