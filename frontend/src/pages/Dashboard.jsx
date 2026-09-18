import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { airGuardApi } from '../api/client';
import AqiGauge from '../components/AqiGauge';
import PollutantCard from '../components/PollutantCard';
import TrendBadge from '../components/TrendBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PredictAqiModal from '../components/PredictAqiModal';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceLine
} from 'recharts';
import {
  Wind, Thermometer, Droplets, Compass, RefreshCw, Star,
  TrendingUp, Sparkles, AlertTriangle, ArrowRight, Shield,
  Copy, Check, Sliders, CloudRain, Flame, Activity, Users,
  HeartPulse, Baby, Dumbbell, ShieldAlert, CheckCircle2
} from 'lucide-react';

export default function Dashboard({ selectedCity, onSelectCity, cities = [] }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);

  // Interactive Demographic Persona state for Health Advisory
  const [selectedPersona, setSelectedPersona] = useState('general');
  const [checklist, setChecklist] = useState({});

  // Interactive Atmospheric Dispersion Simulator state ("What-If Scenario")
  const [simWind, setSimWind] = useState(8.0);
  const [simRain, setSimRain] = useState('none'); // 'none', 'light', 'heavy'
  const [simInversion, setSimInversion] = useState(false);
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);

  useEffect(() => {
    loadDashboardData(selectedCity);
  }, [selectedCity]);

  // Sync simulator defaults with actual live readings
  useEffect(() => {
    if (current && !isSimulatorActive) {
      setSimWind(current.windSpeed || 8.0);
    }
  }, [current, isSimulatorActive]);

  const loadDashboardData = async (cityName) => {
    try {
      setLoading(true);
      setError(null);

      const [currRes, histRes, trendsRes, favRes] = await Promise.all([
        airGuardApi.getCurrent(cityName),
        airGuardApi.getHistory(cityName, 72),
        airGuardApi.getTrends(cityName),
        airGuardApi.getFavorites().catch(() => ({ data: [] })),
      ]);

      setCurrent(currRes.data);
      setHistory(histRes.data || []);
      setTrends(trendsRes.data || null);

      const favs = favRes.data || [];
      setIsFavorite(favs.some((f) => f.name?.toLowerCase() === cityName.toLowerCase()));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load air quality data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData(selectedCity);
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await airGuardApi.removeFavorite(selectedCity);
        setIsFavorite(false);
      } else {
        await airGuardApi.addFavorite(selectedCity);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const copySnapshot = () => {
    if (!current) return;
    const text = `AirGuard AI Snapshot: ${current.cityName}
AQI: ${current.aqi} (${current.aqiCategory})
PM2.5: ${current.pm25} µg/m³ | PM10: ${current.pm10} µg/m³
Temp: ${current.temperature}°C | Humidity: ${current.humidity}% | Wind: ${current.windSpeed} km/h
Data Source: ${current.dataSource || 'Copernicus CAMS Live'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -------------------------------------------------------------
  // Atmospheric Physics Simulator Calculations (What-If Sandbox)
  // -------------------------------------------------------------
  const simulationResults = useMemo(() => {
    if (!current) return null;
    const basePm25 = current.pm25 || 35.0;
    const baseWind = current.windSpeed || 8.0;

    // Advective ventilation dilution factor: F = (1 + 0.12 * base_wind) / (1 + 0.12 * sim_wind)
    const windFactor = (1 + 0.12 * baseWind) / (1 + 0.12 * simWind);

    // Wet precipitation scavenging factor
    let rainFactor = 1.0;
    if (simRain === 'light') rainFactor = 0.72; // 28% washout
    if (simRain === 'heavy') rainFactor = 0.45; // 55% washout

    // Thermal inversion trapping factor
    const inversionFactor = simInversion ? 1.45 : 1.0; // 45% pollution accumulation

    const simPm25 = Math.max(2.0, Math.round(basePm25 * windFactor * rainFactor * inversionFactor * 10.0) / 10.0);
    
    // Approximate US EPA AQI from simulated PM2.5
    let simAqi = 50;
    if (simPm25 <= 12.0) simAqi = Math.round((50 / 12.0) * simPm25);
    else if (simPm25 <= 35.4) simAqi = Math.round(51 + ((49 / 23.3) * (simPm25 - 12.1)));
    else if (simPm25 <= 55.4) simAqi = Math.round(101 + ((49 / 19.9) * (simPm25 - 35.5)));
    else if (simPm25 <= 150.4) simAqi = Math.round(151 + ((49 / 94.9) * (simPm25 - 55.5)));
    else if (simPm25 <= 250.4) simAqi = Math.round(201 + ((99 / 99.9) * (simPm25 - 150.5)));
    else simAqi = Math.min(500, Math.round(301 + ((199 / 249.9) * (simPm25 - 250.5))));

    const deltaPercent = Math.round(((simAqi - current.aqi) / current.aqi) * 100);

    return {
      simPm25,
      simAqi,
      deltaPercent,
      isImproved: simAqi < current.aqi
    };
  }, [current, simWind, simRain, simInversion]);

  // -------------------------------------------------------------
  // Demographic Health Advisory Personas
  // -------------------------------------------------------------
  const personaDetails = useMemo(() => {
    const aqi = current?.aqi || 100;
    const pm25 = current?.pm25 || 35.0;

    switch (selectedPersona) {
      case 'asthma':
        return {
          title: 'Asthma & Respiratory Patients',
          icon: HeartPulse,
          mask: aqi > 75 ? 'N95 / FFP2 Respirator Required' : 'Well-fitted surgical mask',
          maskColor: aqi > 75 ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          safetyScore: Math.max(10, Math.min(100, 100 - Math.round(aqi * 0.45))),
          advice: `Bronchial reactivity is heightened at ${pm25} µg/m³ PM2.5. Inhalation of microscopic particulates triggers bronchospasms. Keep fast-acting bronchodilator rescue inhalers accessible at all times and seal indoor windows.`,
          protocols: [
            'Carry prescribed rescue inhaler (Albuterol / Levolin)',
            'Avoid morning outdoor walks before solar boundary layer rises',
            'Operate indoor True-HEPA filter continuously'
          ]
        };
      case 'vulnerable':
        return {
          title: 'Children, Infants & Elderly (>65)',
          icon: Baby,
          mask: aqi > 90 ? 'Certified pediatric/snug N95' : 'Cloth barrier / Limit outdoor time',
          maskColor: aqi > 90 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          safetyScore: Math.max(15, Math.min(100, 100 - Math.round(aqi * 0.4))),
          advice: `Children have higher ventilation-to-body-mass ratios, and seniors have reduced cardiovascular elasticity. Current air quality presents moderate to high physiological stress. Reschedule outdoor playground recreation to clean air windows.`,
          protocols: [
            'Keep school and daycare recess indoors',
            'Hydrate with warm fluids to soothe mucosal membranes',
            'Monitor for wheezing, fatigue, or eye irritation'
          ]
        };
      case 'athletes':
        return {
          title: 'Runners, Cyclists & Athletes',
          icon: Dumbbell,
          mask: aqi > 120 ? 'Training mask or shift indoors' : 'No mask needed during active cardio',
          maskColor: aqi > 120 ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          safetyScore: Math.max(10, Math.min(100, 100 - Math.round(aqi * 0.35))),
          advice: `Heavy aerobic respiration increases tidal volume up to 10x, drawing particulate matter deep into the bronchial tree. At current AQI of ${aqi}, intense outdoor workouts should be substituted with indoor treadmill or stationary cycling.`,
          protocols: [
            'Shift cardio sessions to air-filtered gym facilities',
            'Avoid exercising near high-density traffic corridors',
            'Monitor peak heart rate recovery and airway tightness'
          ]
        };
      default:
        return {
          title: 'General Population',
          icon: Users,
          mask: aqi > 130 ? 'N95 Respirator for prolonged transit' : (aqi > 75 ? 'Light barrier recommended' : 'No mask required'),
          maskColor: aqi > 130 ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          safetyScore: Math.max(20, Math.min(100, 100 - Math.round(aqi * 0.3))),
          advice: aqi <= 50
            ? 'Air quality is pristine. Perfect conditions for outdoor living, ventilation, and recreation.'
            : aqi <= 100
            ? 'Moderate particulate background. General population can enjoy normal activities with standard ventilation.'
            : 'Elevated particulate pollution detected. Limit prolonged heavy outdoor physical exertion.',
          protocols: [
            'Check daily 24h predictive forecast before planning travel',
            'Run vehicle AC on recirculate mode in heavy traffic',
            'Air out living spaces when wind speed exceeds 10 km/h'
          ]
        };
    }
  }, [selectedPersona, current]);

  // Format historical chart data
  const chartData = history.map((item) => {
    const d = new Date(item.timestamp);
    return {
      time: d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit' }),
      aqi: item.aqi,
      pm25: item.pm25,
      pm10: item.pm10,
      no2: item.no2,
    };
  });

  if (loading && !refreshing) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <LoadingSkeleton className="h-28" />
        <LoadingSkeleton className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-80" />
          <LoadingSkeleton className="h-80 md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 relative">
      
      {/* Dynamic Ambient Background Glow reflecting station AQI */}
      <div
        className="absolute top-10 left-1/4 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-1000 -z-10"
        style={{ backgroundColor: current?.categoryColor || '#10b981' }}
      />

      {/* 1. Quick-Access Station Pills Ribbon */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 max-w-full">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1.5 mr-1">
          <Activity className="w-3.5 h-3.5 text-brand-400" />
          <span>Stations:</span>
        </span>
        {cities.map((c) => {
          const isSelected = c.name.toLowerCase() === selectedCity.toLowerCase();
          return (
            <button
              key={c.name}
              id={`station-pill-${c.name.toLowerCase()}`}
              onClick={() => onSelectCity(c.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center space-x-1.5 border cursor-pointer ${
                isSelected
                  ? 'bg-brand-500 text-slate-950 border-brand-400 shadow-md shadow-brand-500/20 scale-[1.03] font-bold'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950 animate-pulse' : 'bg-brand-400'}`} />
              <span>{c.name}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {c.country?.slice(0, 2).toUpperCase() || 'GL'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Ingestion Status Banner */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">Live Station Telemetry Active</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400">Copernicus Atmosphere Monitoring Service (CAMS)</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] mt-1 sm:mt-0">
          <span>Synced: {current?.timestamp ? new Date(current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="glass-panel border-rose-500/40 bg-rose-950/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs rounded-lg border border-rose-500/40 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Hero Station Banner with Dynamic Ambient AQI Aura */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden transition-all duration-500">
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-20"
          style={{ backgroundColor: current?.categoryColor || '#10b981' }}
        />
        <div
          className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-15"
          style={{ backgroundColor: current?.categoryColor || '#10b981' }}
        />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {current?.cityName || selectedCity}
              </h1>
              <span className="text-sm text-slate-400 font-medium">
                {current?.state ? `${current.state}, ` : ''}{current?.country}
              </span>
              <button
                onClick={toggleFavorite}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isFavorite
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Save as favorite'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center space-x-1 bg-slate-800/80 px-2.5 py-1 rounded-md">
                <Compass className="w-3.5 h-3.5 text-brand-400" />
                <span>{current?.latitude?.toFixed(2)}°N, {current?.longitude?.toFixed(2)}°E</span>
              </span>
              <span>Updated: {current?.timestamp ? new Date(current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
              <span>•</span>
              <TrendBadge trend={current?.trend} percentage={trends?.percentageChange24h} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copySnapshot}
              title="Copy Telemetry Snapshot to Clipboard"
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Snapshot'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            
            {/* Dedicated Interactive Predict AQI Button */}
            <button
              id="btn-predict-aqi-hero"
              onClick={() => setIsPredictModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 via-emerald-400 to-cyan-400 hover:from-brand-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer group"
              title="Open Interactive Machine Learning Predictor"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950 group-hover:rotate-12 transition-transform" />
              <span>⚡ Predict 24h AQI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid: Gauge + Weather Stats + Quick Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AQI Gauge */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Atmospheric Index</span>
            <span className="text-[11px] font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              CAMS Ambient Sensor
            </span>
          </div>

          <AqiGauge
            aqi={current?.aqi || 0}
            category={current?.aqiCategory || 'Moderate'}
            color={current?.categoryColor || '#10b981'}
            subtitle={`Primary Pollutant: ${current?.primaryPollutant || 'PM2.5'}`}
          />

          <div className="w-full mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-300">
            {current?.categoryDescription}
          </div>
        </div>

        {/* Middle & Right Column: Weather Stats + Interactive Demographic Health Card */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weather & Environmental Factors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Temperature</span>
              </span>
              <span className="text-2xl font-bold text-white mt-2">
                {current?.temperature != null ? `${current.temperature.toFixed(1)}°C` : '--'}
              </span>
              <span className="text-[10px] text-slate-500">Surface ambient</span>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Humidity</span>
              </span>
              <span className="text-2xl font-bold text-white mt-2">
                {current?.humidity != null ? `${Math.round(current.humidity)}%` : '--'}
              </span>
              <span className="text-[10px] text-slate-500">Relative moisture</span>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Wind className="w-4 h-4 text-teal-400" />
                <span>Wind Speed</span>
              </span>
              <span className="text-2xl font-bold text-white mt-2">
                {current?.windSpeed != null ? `${current.windSpeed.toFixed(1)} km/h` : '--'}
              </span>
              <span className="text-[10px] text-slate-500">
                {current?.windSpeed < 8 ? 'Stagnant (Low dispersion)' : 'Active horizontal dispersion'}
              </span>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-900/90 border-brand-500/20">
              <span className="text-xs text-brand-400 flex items-center space-x-1.5 font-semibold">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Next 24h Preview</span>
              </span>
              <div className="mt-1 flex items-baseline space-x-1.5">
                <span className="text-2xl font-extrabold text-white">
                  {current?.predictedAqi != null ? Math.round(current.predictedAqi) : '--'}
                </span>
                <span className="text-xs text-slate-400">AQI</span>
              </div>
              <span className="text-[10px] font-medium text-emerald-400">
                {current?.predictedCategory || 'Evaluating'}
              </span>
            </div>
          </div>

          {/* Interactive Demographic Health Advisory Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/90 space-y-4">
            
            {/* Header with Demographic Persona Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Demographic Health Advisory</h4>
                  <p className="text-[11px] text-slate-400">Tailored medical protocols by demographic vulnerability</p>
                </div>
              </div>

              {/* Persona Selector Tabs */}
              <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'general', label: 'General', icon: Users },
                  { id: 'asthma', label: 'Asthma', icon: HeartPulse },
                  { id: 'vulnerable', label: 'Kids & Seniors', icon: Baby },
                  { id: 'athletes', label: 'Athletes', icon: Dumbbell }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedPersona(tab.id)}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedPersona === tab.id
                          ? 'bg-purple-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Content Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {personaDetails.advice}
                </p>

                {/* Interactive Checklist */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actionable Protocol Checklist:</span>
                  {personaDetails.protocols.map((item, idx) => {
                    const isChecked = checklist[`${selectedPersona}-${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => setChecklist(prev => ({ ...prev, [`${selectedPersona}-${idx}`]: !prev[`${selectedPersona}-${idx}`] }))}
                        className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none group"
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700 group-hover:border-slate-500'}`}>
                          {isChecked && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <span className={isChecked ? 'line-through text-slate-500' : ''}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Safety Score Meter & Mask Badge */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 font-medium">Outdoor Safety Score:</span>
                    <span className="font-bold text-white">{personaDetails.safetyScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${personaDetails.safetyScore}%`,
                        backgroundColor: personaDetails.safetyScore > 70 ? '#10b981' : (personaDetails.safetyScore > 40 ? '#fbbf24' : '#ef4444')
                      }}
                    />
                  </div>
                </div>

                <div className={`p-2 rounded-lg border text-[11px] font-medium flex items-center space-x-1.5 ${personaDetails.maskColor}`}>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{personaDetails.mask}</span>
                </div>

                <button
                  onClick={() => navigate('/advisory')}
                  className="w-full py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all"
                >
                  <span>Ask AI Assistant</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 2. Interactive Atmospheric Dispersion Simulator (Interactive Sandbox) */}
      <div className="glass-panel rounded-2xl p-6 border border-teal-500/30 bg-slate-900/90 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">Atmospheric Dispersion Simulator</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase font-mono">
                  What-If Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">Simulate how wind velocity and rain washout clean the ambient air in real time</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSimWind(current?.windSpeed || 8.0);
              setSimRain('none');
              setSimInversion(false);
              setIsSimulatorActive(false);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors w-fit"
          >
            Reset to Live Readings
          </button>
        </div>

        {/* Simulator Controls & Real-Time Impact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Slider 1: Wind Velocity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center space-x-1">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Horizontal Wind Velocity:</span>
              </span>
              <span className="font-bold text-teal-400">{simWind.toFixed(1)} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={simWind}
              onChange={(e) => {
                setSimWind(parseFloat(e.target.value));
                setIsSimulatorActive(true);
              }}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 (Stagnant smog)</span>
              <span>15 (Breezy)</span>
              <span>35 (Gale flush)</span>
            </div>
          </div>

          {/* Selector 2: Precipitation Scavenging */}
          <div className="space-y-2">
            <span className="text-xs text-slate-300 font-medium flex items-center space-x-1">
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              <span>Precipitation (Wet Deposition):</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {[
                { id: 'none', label: 'Dry' },
                { id: 'light', label: 'Drizzle' },
                { id: 'heavy', label: 'Downpour' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSimRain(r.id); setIsSimulatorActive(true); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    simRain === r.id
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 block">Rain scrubs particulates from boundary layer</span>
          </div>

          {/* Simulator Output Result Card */}
          {simulationResults && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Simulated Outcome:</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-extrabold text-white">{simulationResults.simAqi}</span>
                    <span className="text-xs text-slate-400">AQI</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${simulationResults.deltaPercent <= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {simulationResults.deltaPercent > 0 ? `+${simulationResults.deltaPercent}%` : `${simulationResults.deltaPercent}%`}
                    </span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Base: </span>
                  <span className="text-white font-bold">{current?.aqi}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Simulated PM2.5 drops to <strong className="text-teal-300">{simulationResults.simPm25} µg/m³</strong> via advective dilution and atmospheric transport.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Criteria Pollutants Drill-Down Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Key Criteria Pollutants</h2>
            <p className="text-xs text-slate-400">Continuous particulate and gaseous concentration metrics</p>
          </div>
          <button
            onClick={() => navigate('/pollutants')}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
          >
            <span>Detailed Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <PollutantCard
            code="PM2.5"
            name="Fine Particulates"
            value={current?.pm25}
            unit="µg/m³"
            status={current?.pm25 <= 35.4 ? 'Moderate' : 'Elevated'}
            statusColor={current?.pm25 <= 35.4 ? '#10b981' : '#f97316'}
            safeRange="< 12.0 µg/m³"
            tooltip="Microscopic particles <= 2.5 µm that penetrate deep into pulmonary alveoli."
          />
          <PollutantCard
            code="PM10"
            name="Coarse Particles"
            value={current?.pm10}
            unit="µg/m³"
            status={current?.pm10 <= 154 ? 'Acceptable' : 'Elevated'}
            statusColor={current?.pm10 <= 154 ? '#10b981' : '#f97316'}
            safeRange="< 54.0 µg/m³"
            tooltip="Dust, pollen, and industrial coarse matter <= 10 µm."
          />
          <PollutantCard
            code="NO2"
            name="Nitrogen Dioxide"
            value={current?.no2}
            unit="µg/m³"
            status={current?.no2 <= 100 ? 'Normal' : 'Elevated'}
            statusColor={current?.no2 <= 100 ? '#10b981' : '#f97316'}
            safeRange="< 53.0 µg/m³"
            tooltip="Emitted from internal combustion engines and power plants."
          />
          <PollutantCard
            code="O3"
            name="Ground Ozone"
            value={current?.o3}
            unit="µg/m³"
            status={current?.o3 <= 140 ? 'Normal' : 'Elevated'}
            statusColor={current?.o3 <= 140 ? '#10b981' : '#ef4444'}
            safeRange="< 105.0 µg/m³"
            tooltip="Photochemical smog created by NOx and VOCs under solar radiation."
          />
          <PollutantCard
            code="SO2"
            name="Sulphur Dioxide"
            value={current?.so2}
            unit="µg/m³"
            status="Safe"
            statusColor="#10b981"
            safeRange="< 35.0 µg/m³"
            tooltip="Gas released from fossil fuel burning and thermal facilities."
          />
          <PollutantCard
            code="CO"
            name="Carbon Monoxide"
            value={current?.co}
            unit="mg/m³"
            status="Safe"
            statusColor="#10b981"
            safeRange="< 4.4 mg/m³"
            tooltip="Byproduct of incomplete fuel combustion in vehicular traffic."
          />
        </div>
      </div>

      {/* Historical Air Quality Chart (72 Hours) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">72-Hour Air Quality Index Timeline</h3>
            <p className="text-xs text-slate-400">Sequential hourly observations from database telemetry</p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Good (&le;50)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Moderate (&le;100)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Unhealthy (&gt;150)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 400]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Good', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine y={100} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Moderate', fill: '#fbbf24', fontSize: 10 }} />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Unhealthy for Sensitive', fill: '#f97316', fontSize: 10 }} />
              <Area type="monotone" dataKey="aqi" name="AQI" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#aqiGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: 14-Day Daily Average Trend & Multi-Pollutant Distribution */}
      {trends?.dailySummaries && trends.dailySummaries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">14-Day Daily Average Trend</h3>
            <p className="text-xs text-slate-400 mb-4">Aggregated daily AQI levels with environmental categorization</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.dailySummaries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="averageAqi" name="Average AQI" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Multi-City Comparison Explorer</h3>
              <p className="text-xs text-slate-400 mb-4">Analyze cross-regional dispersion and criteria pollutants</p>
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Compare <span className="font-semibold text-white">{selectedCity}</span> with other international monitoring stations (Delhi, Mumbai, Bengaluru, London, New York, Tokyo, Paris).
                </p>
                <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-medium text-slate-400">Current Station AQI:</span>
                    <span className="font-bold text-white">{current?.aqi} AQI</span>
                  </div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-medium text-slate-400">Trend Direction:</span>
                    <span className="font-bold capitalize text-brand-400">{current?.trend || 'Stable'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-400">Data Source:</span>
                    <span className="font-bold text-emerald-400">{current?.dataSource || 'Copernicus CAMS'}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/compare')}
              className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all"
            >
              <span>Launch Multi-City Comparator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Machine Learning Predictor Modal */}
      <PredictAqiModal
        isOpen={isPredictModalOpen}
        onClose={() => setIsPredictModalOpen(false)}
        selectedCity={selectedCity}
        currentTelemetry={current}
      />

    </div>
  );
}
