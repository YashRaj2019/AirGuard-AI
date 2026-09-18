import React from 'react';
import { ShieldCheck, Database, Cpu, Brain, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <span className="font-semibold text-slate-200">AirGuard AI Platform</span>
            <span className="text-slate-600">|</span>
            <span>Production ML & Environmental Health Advisory Architecture</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-slate-400">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>PostgreSQL 18</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Spring Boot 3.3</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>FastAPI + Scikit-Learn</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>GenAI Advisory</span>
            </span>
          </div>

        </div>

        <div className="mt-4 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AirGuard AI. Built for Software Engineering & Data Science Placements.</p>
          <p className="mt-2 sm:mt-0 text-slate-400">
            Official Data Sources: Copernicus Atmosphere Monitoring Service (CAMS) & Open-Meteo.
          </p>
        </div>
      </div>
    </footer>
  );
}
