import React, { useState } from 'react';
import { Wind, Lock, Mail, User, ArrowRight, Sparkles, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status state
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError('Please provide your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await login('demo@airguard.ai', 'airguard123');
    } catch (err) {
      setError('Could not complete demo login: ' + err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-brand-500 selection:text-slate-950">
      
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-cyan-400 p-0.5 shadow-xl shadow-brand-500/20 mb-4 animate-float">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wind className="w-8 h-8 text-brand-400 stroke-[2.5]" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">AirGuard</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
          </div>

          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Intelligent Air Quality Prediction & Environmental Advisory Platform
          </p>
        </div>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel border border-slate-800/90 py-8 px-4 sm:rounded-2xl sm:px-10 shadow-2xl backdrop-blur-xl">
          
          {/* Quick Demo Login Option */}
          <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Placement Evaluator?</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Explore with 1-click demo credentials</p>
            </div>
            <button
              type="button"
              id="btn-demo-login"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-1.5"
            >
              {demoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>1-Click Login</span>}
            </button>
          </div>

          {/* Form Tabs: Sign In / Create Account */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yash Raj"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading || demoLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Dashboard' : 'Create Your Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted credentials backed by PostgreSQL</span>
          </div>

        </div>
      </div>
    </div>
  );
}
