import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Sparkles, ArrowRight, ArrowLeft, Eye, EyeOff, Check, Camera } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

const ONBOARDING_PRESETS = [
  'Felix',
  'Aneka',
  'Jack',
  'Sophia',
  'Mia',
  'Leo',
  'Luna',
  'Oliver'
].map(seed => `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}`);

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Avatar Selection states
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [customSeed, setCustomSeed] = useState('');

  // Update default avatar preview when user changes screen name
  useEffect(() => {
    if (!selectedAvatar && displayName.trim()) {
      setSelectedAvatar(`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(displayName.trim())}`);
    }
  }, [displayName, selectedAvatar]);

  // Pre-fill username slug from screen name when moving to credentials step
  const handleTransitionToStep3 = () => {
    if (!username.trim() && displayName.trim()) {
      const slug = displayName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      setUsername(slug);
    }
    setStep(3);
  };

  const handleNextStep1 = () => {
    setErrorMsg(null);
    if (!displayName.trim()) {
      setErrorMsg('Please tell us what we should call you! 😊');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address! ✉️');
      return;
    }
    setStep(2);
  };

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

      // If registered (not login), apply custom avatar immediately using server endpoint
      if (!isLogin) {
        const finalAvatar = selectedAvatar || `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(username)}`;
        try {
          const avatarResp = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({ avatarUrl: finalAvatar })
          });
          if (avatarResp.ok) {
            data.user.avatarUrl = finalAvatar;
          }
        } catch (avatarErr) {
          console.error('Failed to auto-apply custom onboarding avatar:', avatarErr);
        }
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col justify-center items-center p-4">
      
      {/* Cute visual ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-850 p-8 rounded-3xl shadow-xl space-y-6 backdrop-blur-md relative z-10"
      >
        {/* Title logo section */}
        <div className="text-center space-y-1.5 select-none">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-1 hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black font-sans tracking-widest uppercase text-zinc-900 dark:text-zinc-100 leading-none">
            GlowUp 10
          </h1>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-widest font-bold uppercase">
            The 10-Point Daily Challenge
          </p>
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 select-none">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              isLogin 
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black' 
                : 'text-zinc-450 dark:text-zinc-500 font-semibold hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
              setStep(1);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              !isLogin 
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black' 
                : 'text-zinc-450 dark:text-zinc-500 font-semibold hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Switch forms rendering */}
        {isLogin ? (
          /* Simplified returning Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-mono font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-widest">
                Username or Email
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
                  placeholder="Your username or email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-mono font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-widest">
                Password
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-450 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 leading-relaxed text-center font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 select-none cursor-pointer"
            >
              {loading ? 'Accessing account...' : 'Access Dashboard'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          /* Multi-step Cute Onboarding Registration Wizard */
          <div className="space-y-5">
            {/* Step Bubbles progress indicator */}
            <div className="flex justify-between items-center px-4 py-1 select-none">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300 ${
                    step === s 
                      ? 'bg-indigo-500 border-indigo-500 text-white scale-110 shadow-sm' 
                      : step > s 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div className={`h-0.5 flex-1 mx-2 transition-colors duration-300 ${
                      step > s ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Error alerts inside wizard */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 leading-relaxed text-center font-medium"
              >
                ⚠️ {errorMsg}
              </motion.div>
            )}

            {/* Steps animations container */}
            <div className="overflow-hidden min-h-[260px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  /* Step 1: Tell Us About Yourself */
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        1. Tell us your name! Let's start the adventure 📝
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        How should the global scoreboard display your achievements?
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          Your Screen Nickname
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                            <User className="w-4 h-4 text-indigo-650" />
                          </span>
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Joyful Habit Builder"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                            <Mail className="w-4 h-4 text-indigo-655" />
                          </span>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. sunshine@habitpass.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer select-none mt-2"
                    >
                      Next: Choose Avatar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  /* Step 2: Choose Your Doodle Avatar */
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        2. Select your challenger doodle companion! 🎨
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Select a preset layout or type a custom seed to preview yours in real-time.
                      </p>
                    </div>

                    {/* Onboarding generator preview */}
                    <div className="flex gap-4 items-center bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-500/30 bg-white flex items-center justify-center shadow-inner flex-shrink-0">
                        <img
                          src={selectedAvatar || `https://api.dicebear.com/7.x/open-peeps/svg?seed=Felix`}
                          alt="Live Onboarding preview"
                          className="w-full h-full object-cover animate-fade-in"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-1 w-full">
                        <span className="block text-[8px] font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-widest font-black">
                          Custom Generator Seed
                        </span>
                        <input
                          type="text"
                          value={customSeed}
                          onChange={(e) => {
                            setCustomSeed(e.target.value);
                            setSelectedAvatar(`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(e.target.value.trim() || 'happy')}`);
                          }}
                          placeholder="Type any word to randomize..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-zinc-805 dark:text-zinc-150 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Presets grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {ONBOARDING_PRESETS.map((url, idx) => {
                        const isSel = selectedAvatar === url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedAvatar(url);
                              setCustomSeed('');
                            }}
                            className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all outline-none ${
                              isSel 
                                ? 'border-indigo-500 scale-105 shadow-sm' 
                                : 'border-zinc-200 dark:border-zinc-850 hover:border-indigo-500/40 hover:scale-102'
                            }`}
                          >
                            <img
                              referrerPolicy="no-referrer"
                              src={url}
                              alt="Preset seed option"
                              className="w-full h-full object-cover"
                            />
                            {isSel && (
                              <div className="absolute inset-0 bg-indigo-500/15 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3px]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10.5px] rounded-xl flex items-center justify-center gap-1 transition-all select-none cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleTransitionToStep3}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer select-none"
                      >
                        Next: Secure Handle
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  /* Step 3: Create Password & Finish */
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        3. Set your account handle & password 🔒
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        This is the final step to secure your score logs.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          Your Account Handle
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                            <User className="w-4 h-4 text-indigo-600" />
                          </span>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="e.g. habit_runner"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          Account Password
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                            <Lock className="w-4 h-4 text-indigo-600" />
                          </span>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-450 hover:text-zinc-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-[10.5px] rounded-xl flex items-center justify-center gap-1 transition-all select-none cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 select-none cursor-pointer"
                        >
                          {loading ? 'Registering...' : 'Start Glowing Up ✨'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <p className="text-[10px] text-zinc-405 dark:text-zinc-500 text-center select-none leading-relaxed">
          GlowUp 10 combines daily cognitive reading benchmarks with physical and focus limits. By joining, you commit to 10 points of structured development daily.
        </p>

      </motion.div>
    </div>
  );
}
