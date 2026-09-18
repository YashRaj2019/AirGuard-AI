import React, { useState, useEffect } from 'react';
import { airGuardApi } from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts';
import { Cpu, CheckCircle2, BarChart2, Award, Zap, Database, GitBranch, Check, Radio, PlayCircle } from 'lucide-react';
import { useModel } from '../context/ModelContext';

export default function ModelInsights() {
  const { activeModel, setActiveModel, activeModelDetails } = useModel();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const res = await airGuardApi.getModelPerformance();
      setPerformance(res.data);
    } catch (err) {
      console.error('Failed to load model performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const models = performance?.models || {};
  const modelNames = Object.keys(models);

  // Transform for comparison bar charts
  const comparisonData = modelNames.map((name) => ({
    name: name.replace(' Regressor', '').replace(' Regression', ''),
    fullName: name,
    MAE: models[name].mae,
    RMSE: models[name].rmse,
    R2: models[name].r2,
    trainSamples: models[name].train_samples,
    testSamples: models[name].test_samples,
  }));

  // Find best model
  const bestModelName = performance?.best_model || 'Baseline (Ridge Regression)';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Cpu className="w-4 h-4" />
          <span>Machine Learning Benchmark & Model Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Model Evaluation & Performance Insights
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Empirical regression benchmark across multiple algorithmic architectures using strict temporal validation splits (no data leakage). Select and activate your desired model to govern live predictions across the platform.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-96" />
      ) : (
        <>
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-brand-500/40 bg-brand-500/5">
              <span className="text-xs text-brand-300 flex items-center space-x-1.5 font-semibold">
                <PlayCircle className="w-4 h-4 text-brand-400" />
                <span>Active Live Engine</span>
              </span>
              <p className="text-sm font-extrabold text-white mt-2 truncate" title={activeModel}>
                {activeModel}
              </p>
              <span className="text-[10px] text-brand-400 font-medium">Currently governing forecasts</span>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Benchmark Champion</span>
              </span>
              <p className="text-sm font-bold text-emerald-400 mt-2 truncate" title={bestModelName}>
                {bestModelName}
              </p>
              <span className="text-[10px] text-slate-500">Min Out-of-Sample RMSE</span>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Training Records</span>
              </span>
              <p className="text-xl font-bold text-white mt-2">
                {performance?.total_training_records?.toLocaleString() || '8,640'}
              </p>
              <span className="text-[10px] text-slate-500">Chronological 80% split</span>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Features Used</span>
              </span>
              <p className="text-xl font-bold text-white mt-2">
                {performance?.features_count || 21}
              </p>
              <span className="text-[10px] text-slate-500">Lags, rollings, cycles, weather</span>
            </div>
          </div>

          {/* Model Comparison Table with Interactive Mode Selection */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white mb-0.5">Architecture Comparison & Model Activation</h3>
                <p className="text-xs text-slate-400">Click on any row or use the action button to activate a model for live predictions</p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/70 shrink-0">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                <span>Active: <strong className="text-brand-300">{activeModel.split(' ')[0]}</strong></span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Selection</th>
                  <th className="py-3 px-4">Model Architecture</th>
                  <th className="py-3 px-4">MAE (Lower is Better)</th>
                  <th className="py-3 px-4">RMSE (Lower is Better)</th>
                  <th className="py-3 px-4">R² Score (Higher is Better)</th>
                  <th className="py-3 px-4">Sample Count (Train/Test)</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {comparisonData.map((row) => {
                  const isCurrentActive = row.fullName === activeModel;
                  const isBenchmarkBest = row.fullName === bestModelName;
                  return (
                    <tr
                      key={row.fullName}
                      onClick={() => setActiveModel(row.fullName)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isCurrentActive
                          ? 'bg-brand-500/10 hover:bg-brand-500/15'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isCurrentActive
                            ? 'border-brand-400 bg-brand-500'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}>
                          {isCurrentActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <span>{row.fullName}</span>
                          {isCurrentActive && (
                            <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/40 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Active</span>
                            </span>
                          )}
                          {isBenchmarkBest && !isCurrentActive && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                              Top Score
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">{row.MAE.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">{row.RMSE.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">{row.R2.toFixed(4)}</td>
                      <td className="py-3.5 px-4 text-slate-400">{row.trainSamples} / {row.testSamples}</td>
                      <td className="py-3.5 px-4">
                        {isCurrentActive ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>In Production</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModel(row.fullName);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-brand-500 hover:text-slate-950 text-slate-300 border border-slate-700 hover:border-brand-400 text-[11px] font-semibold transition-all duration-150 shadow-sm"
                          >
                            Activate Model
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Metric Comparison Visuals: MAE, RMSE, R² */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* MAE Chart */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-1">Mean Absolute Error (MAE)</h4>
              <p className="text-[11px] text-slate-400 mb-4">Average absolute error magnitude in AQI units</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Bar dataKey="MAE" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RMSE Chart */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-1">Root Mean Squared Error (RMSE)</h4>
              <p className="text-[11px] text-slate-400 mb-4">Penalizes large outlier forecast errors</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Bar dataKey="RMSE" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* R2 Chart */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-1">Coefficient of Determination (R²)</h4>
              <p className="text-[11px] text-slate-400 mb-4">Proportion of variance explained by model</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Bar dataKey="R2" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Interview Defense Guide Summary */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-slate-900/90">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Placement Interview Technical Justifications</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">1. Why Regression instead of Classification?</span>
                <p className="text-slate-400">
                  AQI is a continuous metric (0–500). Regressing the exact numerical index preserves ordinal distance, allows computing statistical prediction intervals (±1.96 × RMSE), and maps losslessly to EPA categories post-prediction.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">2. How was Data Leakage Avoided?</span>
                <p className="text-slate-400">
                  Time-series data has strong auto-correlation. All rolling statistics strictly use backward shifts (`shift(1)`), and the train/test split is strictly chronological (first 80% train, last 20% test per station).
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">3. Why ML for Prediction and LLM for Explanation?</span>
                <p className="text-slate-400">
                  LLMs are autoregressive token predictors prone to statistical hallucinations. ML regression handles numerical computation; GenAI synthesizes natural-language explanations from explicit factual context.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">4. Inter-Service Communication (Spring Boot + FastAPI)</span>
                <p className="text-slate-400">
                  Spring Boot acts as the API gateway and orchestrator, storing relational state in PostgreSQL and delegating ML inferences to the FastAPI microservice via reactive WebClient with circuit-breaking fallbacks.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
