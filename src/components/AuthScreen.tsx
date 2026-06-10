import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { identifier: username, password } 
      : { username, displayName, email, password };

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Something went wrong during authentication.');
      }

      // Store JWT token securely
      localStorage.setItem('glowup_jwt_token', data.token);
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col justify-center items-center p-4">
      
      {/* Visual background ambient accent dots */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-850 p-8 rounded-3xl shadow-xl space-y-7 backdrop-blur-md relative z-10"
      >
        {/* Title area */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 mb-1">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
            GlowUp 10
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-wider font-semibold uppercase">
            The 10-Point Daily Challenge
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              isLogin 
                ? 'bg-white dark:bg-zinc-800 text-indigo-500 dark:text-indigo-400 shadow-2xs' 
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              !isLogin 
                ? 'bg-white dark:bg-zinc-800 text-indigo-500 dark:text-indigo-400 shadow-2xs' 
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email (register only) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Username / Identifier */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              {isLogin ? 'Username or Email' : 'Custom Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? "Your username or email" : "e.g. john_doe"}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Display Name (register only) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Your Screen Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              Security Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-450 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Display potential error states */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 leading-relaxed text-center"
            >
              ⚠️ {errorMsg}
            </motion.div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-550 hover:bg-indigo-600 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? 'Validating security...' : isLogin ? 'Access Dashboard' : 'Initiate Challenge'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

        </form>

        <p className="text-[10.5px] text-zinc-450 dark:text-zinc-500 text-center select-none leading-relaxed">
          GlowUp 10 combines intellectual study with restorative bodily boundaries. By accessing this console, you commit to 10 points of daily cognitive growth.
        </p>

      </motion.div>
    </div>
  );
}
