import React, { useState, useEffect } from 'react';
import {
  X, Cpu, TrendingUp, Sparkles, Sliders, Wind, Thermometer,
  ShieldCheck, AlertTriangle, RefreshCw, BarChart2, Check, ArrowRight
} from 'lucide-react';
import { airGuardApi } from '../api/client';
import { useModel } from '../context/ModelContext';

export default function PredictAqiModal({ isOpen, onClose, selectedCity, currentTelemetry }) {
  const { activeModel, setActiveModel, availableModels } = useModel();

  // Parameter state
  const [pm25, setPm25] = useState(65.0);
  const [pm10, setPm10] = useState(110.0);
  const [no2, setNo2] = useState(30.0);
  const [windSpeed, setWindSpeed] = useState(8.0);
  const [temperature, setTemperature] = useState(25.0);
  const [humidity, setHumidity] = useState(60.0);
  const [selectedModel, setSelectedModel] = useState('Baseline (Ridge Regression)');

  // Prediction output state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Sync inputs with current live telemetry when modal opens
  useEffect(() => {
    if (isOpen && currentTelemetry) {
      setPm25(currentTelemetry.pm25 != null ? Number(currentTelemetry.pm25) : 65.0);
      setPm10(currentTelemetry.pm10 != null ? Number(currentTelemetry.pm10) : 110.0);
      setNo2(currentTelemetry.no2 != null ? Number(currentTelemetry.no2) : 30.0);
      setWindSpeed(currentTelemetry.windSpeed != null ? Number(currentTelemetry.windSpeed) : 8.0);
      setTemperature(currentTelemetry.temperature != null ? Number(currentTelemetry.temperature) : 25.0);
      setHumidity(currentTelemetry.humidity != null ? Number(currentTelemetry.humidity) : 60.0);
    }
    if (activeModel) {
      setSelectedModel(activeModel);
    }
    setError(null);
  }, [isOpen, currentTelemetry, activeModel]);

  if (!isOpen) return null;

  const handleResetToLive = () => {
    if (currentTelemetry) {
      setPm25(currentTelemetry.pm25 != null ? Number(currentTelemetry.pm25) : 65.0);
      setPm10(currentTelemetry.pm10 != null ? Number(currentTelemetry.pm10) : 110.0);
      setNo2(currentTelemetry.no2 != null ? Number(currentTelemetry.no2) : 30.0);
      setWindSpeed(currentTelemetry.windSpeed != null ? Number(currentTelemetry.windSpeed) : 8.0);
      setTemperature(currentTelemetry.temperature != null ? Number(currentTelemetry.temperature) : 25.0);
      setHumidity(currentTelemetry.humidity != null ? Number(currentTelemetry.humidity) : 60.0);
    }
  };

  const handleRunPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        city: selectedCity,
        pm25: Number(pm25),
        pm10: Number(pm10),
        no2: Number(no2),
        wind_speed: Number(windSpeed),
        temperature: Number(temperature),
        humidity: Number(humidity),
        model_name: selectedModel
      };

      const res = await airGuardApi.predictAqi(payload);
      if (res.data) {
        setResult(res.data);
      } else {
        throw new Error(res.message || 'Prediction failed');
      }
    } catch (err) {
      console.error('Prediction modal error:', err);
      setError(err.message || 'Unable to generate prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
              <Cpu className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Interactive Machine Learning Predictor
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  {selectedCity}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Forecast 24h Out-of-Sample AQI with empirical atmospheric regressions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Model Algorithm Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Forecasting Algorithm</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Active: <strong className="text-brand-400">{selectedModel}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { name: 'Baseline (Ridge Regression)', tag: 'Champion', desc: 'Best R²: 0.63, lowest RMSE' },
                { name: 'Gradient Boosting Regressor', tag: 'Ensemble', desc: 'Iterative residual minimization' },
                { name: 'Random Forest Regressor', tag: 'Bagging', desc: '100 decision tree estimators' }
              ].map((m) => {
                const isSelected = selectedModel === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedModel(m.name)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-white shadow-md shadow-brand-500/10'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white line-clamp-1">{m.name.split(' ')[0]}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-brand-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Atmospheric Sliders */}
          <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulation Parameters & Environmental Factors</span>
              </span>
              <button
                type="button"
                onClick={handleResetToLive}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Live Sensor Values</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PM2.5 Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">PM2.5 Concentration</span>
                  <span className="font-mono text-brand-400 font-bold">{pm25} µg/m³</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="350"
                  step="1"
                  value={pm25}
                  onChange={(e) => setPm25(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5 (Pristine)</span>
                  <span>100 (Unhealthy)</span>
                  <span>350 (Hazardous)</span>
                </div>
              </div>

              {/* PM10 Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">PM10 Concentration</span>
                  <span className="font-mono text-brand-400 font-bold">{pm10} µg/m³</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="450"
                  step="2"
                  value={pm10}
                  onChange={(e) => setPm10(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>10 (Good)</span>
                  <span>150 (Elevated)</span>
                  <span>450 (Extreme)</span>
                </div>
              </div>

              {/* Wind Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Wind Velocity (Dispersion)</span>
                  <span className="font-mono text-cyan-400 font-bold">{windSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="35"
                  step="0.5"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 km/h (Stagnant)</span>
                  <span>12 km/h (Breezy)</span>
                  <span>35 km/h (Strong)</span>
                </div>
              </div>

              {/* Nitrogen Dioxide Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">NO2 (Combustion Gas)</span>
                  <span className="font-mono text-amber-400 font-bold">{no2} µg/m³</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="1"
                  value={no2}
                  onChange={(e) => setNo2(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5 (Clean)</span>
                  <span>50 (Moderate)</span>
                  <span>150 (Heavy traffic)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Prediction Trigger Button */}
          <div>
            <button
              id="btn-execute-ml-prediction"
              onClick={handleRunPrediction}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-emerald-500 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-brand-500/25 transition-all duration-200 flex items-center justify-center space-x-2.5 disabled:opacity-50 group hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Model Inference across 21 Lag Features...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Run Live Machine Learning Prediction</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Error notice if any */}
          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Prediction Output Results Display */}
          {result && (
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-2xl border border-brand-500/30 shadow-xl space-y-4 animate-scale-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    24-Hour Predicted Out-of-Sample AQI
                  </span>
                  <div className="flex items-baseline space-x-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
                      {result.predictedAqi || result.predicted_aqi}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm"
                      style={{
                        backgroundColor: `${result.categoryColor || '#10b981'}20`,
                        color: result.categoryColor || '#10b981',
                        borderColor: `${result.categoryColor || '#10b981'}40`
                      }}
                    >
                      {result.aqiCategory || result.aqi_category}
                    </span>
                  </div>
                </div>

                {/* 95% Confidence Interval */}
                {result.predictionInterval && (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">95% Prediction Interval</span>
                    <p className="text-sm font-bold font-mono text-cyan-400">
                      [{result.predictionInterval[0]} — {result.predictionInterval[1]}] AQI
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">±1.96 × Model RMSE</span>
                  </div>
                )}
              </div>

              {/* Category Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.categoryDescription || result.category_description}
              </p>

              {/* Major Contributing Factors Bar */}
              {result.contributingFactors && result.contributingFactors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Top Model Feature Attribution Weights</span>
                  </span>
                  <div className="space-y-1.5">
                    {result.contributingFactors.map((f, i) => (
                      <div key={i} className="flex items-center text-xs">
                        <span className="w-36 text-slate-300 font-medium truncate">{f.feature}</span>
                        <div className="flex-1 mx-3 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-brand-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, f.importance || 20)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-brand-400 font-bold text-[11px]">
                          {f.importance}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>US EPA Piecewise Breakpoint Formulation</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
