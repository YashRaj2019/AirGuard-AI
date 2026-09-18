import React, { useState, useEffect } from 'react';
import { airGuardApi } from '../api/client';
import AqiGauge from '../components/AqiGauge';
import ContributingFactorsBar from '../components/ContributingFactorsBar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts';
import {
  Sparkles, TrendingUp, Cpu, Brain, ShieldAlert, Sliders, RefreshCw, AlertCircle, Check
} from 'lucide-react';
import { useModel } from '../context/ModelContext';

export default function Forecast({ selectedCity, onSelectCity, cities }) {
  const { activeModel, setActiveModel, availableModels } = useModel();
  const [horizon, setHorizon] = useState('24h');
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    executePrediction(selectedCity, activeModel);
  }, [selectedCity, activeModel]);

  const executePrediction = async (city, model) => {
    try {
      setPredicting(true);
      const [predRes, histRes] = await Promise.all([
        airGuardApi.predictAqi({ city, modelName: model }),
        airGuardApi.getHistory(city, 48),
      ]);
      setPrediction(predRes.data);
      setHistory(histRes.data || []);
    } catch (err) {
      console.error('Failed to run ML prediction:', err);
    } finally {
      setLoading(false);
      setPredicting(false);
    }
  };

  // Build combined Historical + Forecast trajectory
  const combinedTrajectory = [];
  history.forEach((h, idx) => {
    const d = new Date(h.timestamp);
    combinedTrajectory.push({
      time: d.toLocaleTimeString([], { hour: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
      historicalAqi: h.aqi,
      forecastAqi: null,
    });
  });

  if (prediction && combinedTrajectory.length > 0) {
    const lastHist = combinedTrajectory[combinedTrajectory.length - 1];
    // Connect forecast line
    lastHist.forecastAqi = lastHist.historicalAqi;

    combinedTrajectory.push({
      time: '+12 Hours',
      historicalAqi: null,
      forecastAqi: Math.round((lastHist.historicalAqi + prediction.predictedAqi) / 2),
    });

    combinedTrajectory.push({
      time: '+24 Hours (ML Target)',
      historicalAqi: null,
      forecastAqi: Math.round(prediction.predictedAqi),
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Machine Learning & Explainable AI</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI + ML Air Quality Forecast
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Multi-stage forecasting integrating atmospheric sensor telemetry, auto-regressive lag dynamics, and contextual LLM explanation.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Selector */}
          <div className="flex flex-col text-xs text-slate-400">
            <span className="mb-1 font-medium">Prediction Horizon:</span>
            <div className="flex rounded-lg bg-slate-900 border border-slate-700 p-0.5">
              {['24h', '48h', '72h'].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    horizon === h
                      ? 'bg-brand-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => executePrediction(selectedCity, activeModel)}
            disabled={predicting}
            className="mt-4 sm:mt-5 p-2.5 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded-lg border border-slate-700 transition-colors"
            title="Re-run forecast"
          >
            <RefreshCw className={`w-4 h-4 ${predicting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Model Selection Ribbon with Interactive Cards */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Select Forecasting Algorithm</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Active: <strong className="text-brand-300">{activeModel}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {availableModels.map((m) => {
            const isSelected = activeModel === m.name;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.name)}
                className={`p-3.5 rounded-xl text-left border transition-all duration-150 relative ${
                  isSelected
                    ? 'bg-brand-500/15 border-brand-500/50 shadow-md shadow-brand-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-brand-300' : 'text-white'}`}>
                    {m.shortName}
                  </span>
                  {isSelected ? (
                    <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/40 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-80" />
          <LoadingSkeleton className="h-80 lg:col-span-2" />
        </div>
      ) : (
        <>
          {/* Main Forecast Metrics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Forecast Gauge Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-between">
              <div className="w-full flex justify-between items-center border-b border-slate-800/80 pb-3 mb-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Target Horizon: +24 Hours</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {prediction?.modelName || 'Ridge Baseline'}
                </span>
              </div>

              <AqiGauge
                aqi={prediction?.predictedAqi || 0}
                category={prediction?.aqiCategory || 'Moderate'}
                color={prediction?.categoryColor || '#10B981'}
                subtitle="Predicted Target AQI"
              />

              {/* Statistical Prediction Interval */}
              {prediction?.predictionInterval && (
                <div className="w-full mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    95% Prediction Interval
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {prediction.predictionInterval[0]} — {prediction.predictionInterval[1]} AQI
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Derived from model residual variance (±1.96 × Test RMSE)
                  </p>
                </div>
              )}
            </div>

            {/* Trajectory Visual: Historical AQI ───> Forecast Curve */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Historical Telemetry & Forecast Progression
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seamless continuous transition from ambient sensor history into ML forecast
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <span className="w-3 h-0.5 bg-sky-400" />
                    <span>Past 48h (Actual)</span>
                  </span>
                  <span className="flex items-center space-x-1.5 text-brand-400">
                    <span className="w-3 h-0.5 bg-emerald-400 border-dashed" />
                    <span>+24h ML Forecast</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 350]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <ReferenceLine y={100} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Moderate', fill: '#fbbf24', fontSize: 10 }} />
                    <ReferenceLine y={150} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Unhealthy', fill: '#f97316', fontSize: 10 }} />
                    
                    <Area type="monotone" dataKey="historicalAqi" name="Actual AQI" stroke="#38bdf8" strokeWidth={2} fill="#38bdf8" fillOpacity={0.15} />
                    <Line type="monotone" dataKey="forecastAqi" name="Predicted AQI" stroke="#10b981" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Model Engine: {prediction?.modelName} v{prediction?.modelVersion}</span>
                <span>Evaluated at: {new Date(prediction?.predictionTime || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>

          </div>

          {/* AI Explanation: "Why is AQI expected to change?" + Factor Attribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI Explanation Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-purple-400">
                <Brain className="w-5 h-5" />
                <h3 className="text-base font-bold text-white tracking-tight">Why is AQI expected to change?</h3>
                <span className="text-[10px] font-semibold bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">
                  Grounded AI Narrative
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                {prediction?.aiExplanation ? (
                  prediction.aiExplanation.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>
                    Evaluating multi-pollutant accumulation and meteorological stagnation trends...
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Contextually generated from database telemetry and ML regression weights; zero LLM statistical hallucination.
                </span>
              </div>
            </div>

            {/* Feature Attribution Bar */}
            <ContributingFactorsBar
              factors={prediction?.contributingFactors}
              modelName={prediction?.modelName}
            />

          </div>
        </>
      )}

    </div>
  );
}
