import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Wind, Activity, TrendingUp, Layers, GitCompare, Bot, Cpu, History,
  Sparkles, Navigation, Search, Loader2, LogOut, ChevronDown, ShieldCheck, User,
  Palette, Check
} from 'lucide-react';
import CitySearchModal from './CitySearchModal';
import { airGuardApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ selectedCity, onSelectCity, cities = [], onCityAdded }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme, themes, activeTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateStatus, setLocateStatus] = useState(null);
  const userMenuRef = useRef(null);
  const themeMenuRef = useRef(null);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/forecast', label: 'ML Forecast', icon: TrendingUp },
    { to: '/pollutants', label: 'Pollutants', icon: Layers },
    { to: '/compare', label: 'Compare', icon: GitCompare },
    { to: '/advisory', label: 'Ask AirGuard', icon: Bot, highlight: true },
    { to: '/models', label: 'Models', icon: Cpu },
    { to: '/history', label: 'History', icon: History },
  ];

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K to open Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. You can use the "Search" button to find your location.');
      return;
    }

    setLocating(true);
    setLocateStatus('Acquiring GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setLocateStatus('Syncing Copernicus telemetry...');
          const { latitude, longitude } = pos.coords;
          const res = await airGuardApi.locateUser(latitude, longitude);
          if (res.data) {
            if (onCityAdded) {
              onCityAdded(res.data);
            }
            onSelectCity(res.data.name);
          }
        } catch (err) {
          console.error('Location sync error:', err);
          alert(`Location sync failed: ${err.message}. Please search your city using the Search button.`);
        } finally {
          setLocating(false);
          setLocateStatus(null);
        }
      },
      (err) => {
        setLocating(false);
        setLocateStatus(null);
        console.warn('Geolocation error:', err.message);
        alert(`Location permission was denied or unavailable (${err.message}). Click "Search" to find any town or city globally.`);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Left: Brand Logo */}
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
              id="nav-brand-logo"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                <Wind className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-bold tracking-tight text-white font-sans">AirGuard</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
                </div>
                <p className="text-[9px] text-slate-400 tracking-wider uppercase font-medium">Environmental Intelligence</p>
              </div>
            </div>

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                          : item.highlight
                          ? 'text-emerald-300 hover:bg-slate-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>{item.label}</span>
                    {item.highlight && (
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Controls & User Profile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              
              {/* Use My Location GPS Button */}
              <button
                id="btn-use-my-location"
                onClick={handleUseMyLocation}
                disabled={locating}
                title="Detect your GPS location and track local AQI"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-semibold transition-all duration-150 shadow-sm disabled:opacity-50 group whitespace-nowrap"
              >
                {locating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-emerald-400 fill-emerald-400/20" />
                )}
                <span className="hidden sm:inline">{locating ? 'Locating...' : 'My Location'}</span>
              </button>

              {/* Search Global Cities Button */}
              <button
                id="btn-search-city"
                onClick={() => setIsSearchOpen(true)}
                title="Search any city worldwide (Ctrl+K)"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Search</span>
                <span className="hidden lg:inline text-[10px] text-slate-500 border border-slate-700/80 px-1 rounded font-mono">⌘K</span>
              </button>

              {/* Theme & Background Switcher */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  id="btn-theme-switcher"
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  title={`Appearance: ${activeTheme.name}. Click to change background theme.`}
                  className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-brand-500/40 text-xs font-medium transition-colors whitespace-nowrap group"
                >
                  <Palette className="w-3.5 h-3.5 text-brand-400 group-hover:rotate-12 transition-transform duration-200" />
                  <span className="hidden xl:inline text-xs font-medium text-slate-300">{activeTheme.name.split(' ')[0]}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-white/20 hidden sm:block shadow-sm"
                    style={{ backgroundColor: activeTheme.accentColor }}
                  />
                </button>

                {/* Theme Selector Popover */}
                {isThemeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-3.5 z-50 backdrop-blur-2xl animate-scale-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <Palette className="w-3.5 h-3.5 text-brand-400" />
                          <span>Canvas Background</span>
                        </h4>
                        <p className="text-[10px] text-slate-400">Switch workspace background & aura</p>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/20">
                        4 Modes
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {themes.map((t) => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id);
                              setIsThemeMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left ${
                              isSelected
                                ? 'bg-brand-500/15 border border-brand-500/40 shadow-sm'
                                : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              {/* Swatch circle */}
                              <div
                                className="w-5 h-5 rounded-lg border border-slate-700 flex items-center justify-center shrink-0 shadow-inner"
                                style={{ backgroundColor: t.accentColor }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              </div>
                              <div>
                                <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {t.name}
                                </p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{t.description}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-brand-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* City Dropdown Selector */}
              <div className="relative">
                <select
                  id="city-selector"
                  value={selectedCity}
                  onChange={(e) => onSelectCity && onSelectCity(e.target.value)}
                  className="bg-slate-900/90 text-xs sm:text-sm font-medium text-slate-200 border border-slate-700/80 rounded-lg px-2.5 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer shadow-inner max-w-[125px] sm:max-w-[160px] truncate"
                >
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      📍 {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Profile Dropdown Pill - Never Overflows! */}
              {user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="btn-user-profile"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1.5 p-1 sm:px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/40 transition-all duration-150 group"
                    title={`${user.name} (${user.email})`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 via-emerald-500 to-cyan-400 text-slate-950 font-extrabold flex items-center justify-center text-[11px] shadow-sm shadow-brand-500/20">
                      {getInitials(user.name)}
                    </div>
                    <span className="hidden xl:inline text-xs font-semibold text-slate-200 max-w-[70px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-brand-400' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-3 z-50 backdrop-blur-2xl animate-scale-in">
                      
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-2">
                        <div className="flex items-center space-x-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-emerald-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                            {getInitials(user.name)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{user.role === 'ROLE_ADMIN' ? 'Placement Admin / Evaluator' : 'Active Session'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="px-2.5 py-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Active Station:</span>
                          <span className="font-semibold text-brand-400">{selectedCity}</span>
                        </div>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          id="btn-logout"
                          className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Locating feedback banner */}
        {locating && locateStatus && (
          <div className="bg-brand-500/20 border-t border-brand-500/30 px-4 py-1 text-center text-xs text-brand-300 font-medium flex items-center justify-center space-x-2 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{locateStatus}</span>
          </div>
        )}
      </header>

      {/* Worldwide City Search Modal */}
      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onCitySelected={(city) => {
          if (onCityAdded) onCityAdded(city);
          onSelectCity(city.name);
        }}
      />
    </>
  );
}
