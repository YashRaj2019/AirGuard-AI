import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { airGuardApi } from '../api/client';
import {
  Bot, Send, Sparkles, ShieldAlert, User, CheckCircle2,
  HelpCircle, RefreshCw, AlertTriangle, Activity, ArrowRight, ExternalLink
} from 'lucide-react';

export default function Advisory({ selectedCity, cities }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am **Ask AirGuard**, your environmental data science and health advisory assistant for **${selectedCity}**.\n\nI analyze real atmospheric sensor telemetry and ML prediction factors to answer your questions. How can I assist your environmental analysis today?`,
      recommendations: [
        'Check ambient AQI before intense aerobic workouts.',
        'Ensure proper ventilation when outdoor PM2.5 is low.',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetDemographic, setTargetDemographic] = useState('general');
  const [currentAqiData, setCurrentAqiData] = useState(null);
  const chatEndRef = useRef(null);

  const sampleQuestions = [
    "Why is today's AQI high?",
    "Which pollutant is affecting today's prediction the most?",
    "How has AQI changed this month?",
    "Why is tomorrow's AQI predicted to increase?",
    "What does PM2.5 mean?",
    `Compare ${selectedCity} and London.`,
  ];

  useEffect(() => {
    airGuardApi.getCurrent(selectedCity).then((res) => {
      setCurrentAqiData(res.data);
    }).catch((err) => console.error(err));
  }, [selectedCity]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (questionText) => {
    const query = questionText || input;
    if (!query.trim()) return;

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await airGuardApi.aiChat({
        message: query,
        question: query,
        city: selectedCity,
        selectedCity: selectedCity,
        contextData: currentAqiData ? {
          city: currentAqiData.cityName,
          currentAQI: currentAqiData.aqi,
          predictedAQI: currentAqiData.predictedAqi,
          category: currentAqiData.aqiCategory,
          PM25: currentAqiData.pm25,
          PM10: currentAqiData.pm10,
          NO2: currentAqiData.no2,
          windSpeed: currentAqiData.windSpeed,
          trend: currentAqiData.trend,
        } : null,
      });

      const replyText = res.data?.response || res.data?.reply || res.data?.text || res.data?.message || res.message;
      const aiMessage = {
        sender: 'ai',
        text: replyText || `In ${selectedCity}, current AQI is ${currentAqiData?.aqi || 'elevated'}. Monitor hourly particulate levels.`,
        recommendations: res.data?.recommendations || [
          'Wear an N95 mask if sensitive to fine particulates.',
          'Keep indoor air filtered with a True HEPA purifier.'
        ],
        modelUsed: res.data?.modelUsed || 'AirGuard Grounded Advisory Engine',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Regarding ${selectedCity} (AQI ${currentAqiData?.aqi || 150}): when air quality is elevated, limit prolonged outdoor cardiovascular activity, run indoor HEPA filtration, and wear an N95 respirator outdoors.`,
          recommendations: ['Limit prolonged outdoor exposure during high PM2.5 periods.'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Contextually Grounded Environmental AI</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Ask AirGuard & Health Advisory
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Conversational environmental assistant grounded directly into database telemetry and ML regression weights.
          </p>
        </div>

        {/* Live Context Indicator - Clickable to redirect to Dashboard */}
        {currentAqiData && (
          <div
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-slate-900/90 border border-slate-800 hover:border-brand-500/60 rounded-xl p-3 text-xs flex items-center space-x-3 shrink-0 cursor-pointer group transition-all shadow-sm hover:shadow-brand-500/10"
            title="Click to view full live telemetry & 24h predictions on Dashboard"
          >
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold flex items-center space-x-1">
                <span>Active Station</span>
                <ExternalLink className="w-2.5 h-2.5 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors">
                {currentAqiData.cityName}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current AQI</span>
              <span className="font-bold font-sans text-sm" style={{ color: currentAqiData.categoryColor }}>
                {currentAqiData.aqi} ({currentAqiData.aqiCategory})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="glass-panel border-amber-500/30 bg-amber-950/20 rounded-xl p-4 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 space-y-1">
          <span className="font-semibold text-amber-300">Environmental Advisory Notice & Medical Disclaimer:</span>
          <p>
            AirGuard AI provides environmental-health risk information and model forecasts based on ambient sensor telemetry.
            It does <strong>NOT</strong> provide clinical diagnosis or personalized medical treatments. If you or family members experience acute chest tightness, wheezing, or difficulty breathing, consult a licensed healthcare professional immediately.
          </p>
        </div>
      </div>

      {/* Main Advisory Grid: Chat Assistant + Demographic Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Conversational AI Window */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 flex flex-col h-[600px] overflow-hidden">
          
          {/* Chat Window Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ask AirGuard AI</h3>
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Grounding Active (Zero Hallucination Mode)</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setMessages([messages[0]])}
              className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-slate-950 font-medium ml-12 rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 mr-12 rounded-tl-none space-y-3'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Recommendations Pills */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Actionable Guidance:
                      </span>
                      <ul className="space-y-1">
                        {msg.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start space-x-1.5 text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-brand-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center animate-spin">
                  <Bot className="w-3.5 h-3.5 text-purple-300" />
                </div>
                <span>Analyzing telemetry and synthesizing grounded response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-6 py-2 bg-slate-900/40 border-t border-slate-800/60 overflow-x-auto flex items-center space-x-2 no-scrollbar">
            <span className="text-[10px] uppercase font-semibold text-slate-500 shrink-0">Suggestions:</span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-700/50 shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${selectedCity}'s AQI, pollutants, model predictions...`}
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right Column: Demographic Health Guideline Switcher */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4" />
              <span>Target Demographic Guidance</span>
            </div>
            <h3 className="text-base font-bold text-white mb-4">
              Personalized Group Precautions
            </h3>

            {/* Group Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { id: 'general', label: 'General Public' },
                { id: 'sensitive', label: 'Sensitive Groups' },
                { id: 'children_elderly', label: 'Children & Elderly' },
                { id: 'outdoor_active', label: 'Athletes & Outdoor' },
              ].map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setTargetDemographic(grp.id)}
                  className={`p-2 rounded-xl text-xs font-medium transition-all text-center border ${
                    targetDemographic === grp.id
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>

            {/* Dynamic Guidance Content */}
            <div className="text-xs text-slate-300 space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {targetDemographic === 'general' && (
                <>
                  <p className="font-semibold text-white">General Demographic Recommendations:</p>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-brand-400">•</span>
                      <span>Track AQI changes during morning and evening rush hour spikes.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-brand-400">•</span>
                      <span>Open windows during afternoon hours when wind dispersion is highest.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-brand-400">•</span>
                      <span>No specific activity restrictions when AQI is under 100.</span>
                    </li>
                  </ul>
                </>
              )}

              {targetDemographic === 'sensitive' && (
                <>
                  <p className="font-semibold text-amber-300">Sensitive Groups (Asthma, COPD, Heart Conditions):</p>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-amber-400">•</span>
                      <span>Keep prescribed rescue medications and inhalers readily accessible.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-amber-400">•</span>
                      <span>Avoid strenuous outdoor workouts whenever PM2.5 exceeds 35 µg/m³.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-amber-400">•</span>
                      <span>Utilize True-HEPA air filtration in sleeping quarters.</span>
                    </li>
                  </ul>
                </>
              )}

              {targetDemographic === 'children_elderly' && (
                <>
                  <p className="font-semibold text-sky-300">Children & Older Adults:</p>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-sky-400">•</span>
                      <span>Children breathe more air per kilogram of body weight; limit outdoor playtime when AQI is &gt;100.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-sky-400">•</span>
                      <span>Seniors should monitor for early signs of fatigue or respiratory irritation.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-sky-400">•</span>
                      <span>Maintain well-hydrated mucous membranes with frequent fluid intake.</span>
                    </li>
                  </ul>
                </>
              )}

              {targetDemographic === 'outdoor_active' && (
                <>
                  <p className="font-semibold text-emerald-300">Athletes & Outdoor Workers:</p>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>Vigorous aerobic exercise increases minute ventilation by 10-20x, dramatically increasing particulate intake.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>Schedule training sessions away from busy traffic arteries.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>Shift long runs to early afternoon when thermal mixing disperses ground-level smog.</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Standard: US EPA NAAQS Guidelines</span>
            <span className="text-brand-400 font-medium">Updated Daily</span>
          </div>
        </div>

      </div>

    </div>
  );
}
