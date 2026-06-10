import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, ShieldCheck, Trophy, Sparkles, RefreshCw, LogIn, Users, MessageSquare } from 'lucide-react';
import { Friend, ActivityItem } from '../types';

interface LandingPageProps {
  onEnterApp: () => void;
}

const IMAGES = [
  { 
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', 
    bg: '#F4845F', 
    panel: '#F79B7F',
    title: 'INTELLECTUAL CALIBER',
    desc: 'Engage in structured readings, academic studies, and cognitive training. Master the Feynman technique and compound your intelligence daily.'
  },
  { 
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', 
    bg: '#6BBF7A', 
    panel: '#85CC92',
    title: 'REFLECTIVE WRITING',
    desc: 'Complete a daily 200+ word journaling or essay challenge. Clarify internal state, construct clean arguments, and lock in daily lessons.'
  },
  { 
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png', 
    bg: '#E882B4', 
    panel: '#ED9DC4',
    title: 'DIGITAL DEEP FOCUS',
    desc: 'Establish clear tech boundaries. Execute phone-free study, block distractions, and safeguard your cognitive resources from dopamine drains.'
  },
  { 
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png', 
    bg: '#6EB5FF', 
    panel: '#8DC4FF',
    title: 'PHYSICAL INTEGRITY',
    desc: 'Condition the biological container. Achieve 7.5+ hours of restorative sleep, complete cardiovascular exercises, and maintain hydration.'
  },
];

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Leaderboard data states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingLB, setLoadingLB] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const leaderboardRef = useRef<HTMLDivElement>(null);

  // Resize check for mobile layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload images on mount
  useEffect(() => {
    IMAGES.forEach((img) => {
      const preload = new Image();
      preload.src = img.src;
    });
  }, []);

  // Fetch public leaderboard and feed
  const fetchPublicData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lbResp = await fetch(`/api/leaderboard?date=${todayStr}`);
      if (lbResp.ok) {
        const fullLB = await lbResp.json();
        // Sort by points desc, then streak desc
        const sorted = [...fullLB].sort((a, b) => {
          if (b.todayPoints !== a.todayPoints) return b.todayPoints - a.todayPoints;
          return b.streak - a.streak;
        });
        setLeaderboard(sorted);
      }

      const actResp = await fetch('/api/activities');
      if (actResp.ok) {
        setActivities(await actResp.json());
      }
    } catch (e) {
      console.error('Failed to load public leaderboard datasets:', e);
    } finally {
      setLoadingLB(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
    // Poll public data every 10 seconds for real-time vibe on landing
    const timer = setInterval(fetchPublicData, 10000);
    return () => clearInterval(timer);
  }, []);

  const navigate = (dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (dir === 'next') {
      setActiveIndex((prev) => (prev + 1) % 4);
    } else {
      setActiveIndex((prev) => (prev + 3) % 4);
    }
    setTimeout(() => {
      setIsAnimating(false);
    }, 65000 / 100); // 650ms lock releases
  };

  const scrollDownToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Roles indices calculations
  const centerIdx = activeIndex;
  const leftIdx = (activeIndex + 3) % 4;
  const rightIdx = (activeIndex + 1) % 4;
  const backIdx = (activeIndex + 2) % 4;

  const getRoleStyle = (index: number) => {
    if (index === centerIdx) {
      return {
        transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`,
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? '52%' : '82%',
        bottom: isMobile ? '24%' : '6%',
      };
    }
    if (index === leftIdx) {
      return {
        transform: 'translateX(-50%) scale(0.9)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '18%' : '28%',
        height: isMobile ? '18%' : '26%',
        bottom: isMobile ? '30%' : '14%',
      };
    }
    if (index === rightIdx) {
      return {
        transform: 'translateX(-50%) scale(0.9)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '82%' : '72%',
        height: isMobile ? '18%' : '26%',
        bottom: isMobile ? '30%' : '14%',
      };
    }
    // backIdx
    return {
      transform: 'translateX(-50%) scale(0.85)',
      filter: 'blur(4px)',
      opacity: 0.7,
      zIndex: 5,
      left: '50%',
      height: isMobile ? '15%' : '20%',
      bottom: isMobile ? '32%' : '14%',
    };
  };

  return (
    <div 
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 50)}
      className="h-screen overflow-y-auto bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 scroll-smooth"
    >
      {/* Sticky/Fixed Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-xs' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        {/* Top-Left Brand Label */}
        <div className="flex items-center gap-2 select-none">
          <div className={`w-3.5 h-3.5 rounded-full blur-[1px] transition-colors duration-300 ${scrolled ? 'bg-indigo-500' : 'bg-white'}`}></div>
          <span 
            onClick={onEnterApp}
            className={`text-sm font-black uppercase tracking-[0.25em] cursor-pointer hover:opacity-85 transition-colors duration-300 ${
              scrolled ? 'text-zinc-900 dark:text-white' : 'text-white'
            }`}
          >
            GLOWUP 10
          </span>
        </div>

        {/* Top-Right Navigation Portal Button */}
        <button
          onClick={onEnterApp}
          className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md active:scale-95 cursor-pointer border ${
            scrolled
              ? 'bg-indigo-600 hover:bg-indigo-750 border-indigo-650 text-white'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Enter Challenge Console
        </button>
      </header>

      {/* 100vh Full Hero Carousel section */}
      <div 
        style={{ 
          backgroundColor: IMAGES[activeIndex].bg,
          fontFamily: 'Inter, sans-serif'
        }}
        className="relative w-full h-screen overflow-hidden transition-colors duration-[650ms] cubic-bezier(0.4,0,0.2,1) flex-shrink-0"
      >
        {/* Grain overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-50 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }}
        />

        {/* Giant Ghost Text */}
        <div className="absolute inset-x-0 top-[18%] flex items-center justify-center pointer-events-none select-none z-2">
          <h2 
            style={{ fontFamily: 'Anton, sans-serif', lineHeight: 1 }}
            className="text-[85px] sm:text-[18vw] lg:text-[25vw] font-black text-white/12 uppercase tracking-tighter text-center whitespace-nowrap"
          >
            GLOWUP 10
          </h2>
        </div>

        {/* Carousel figurines container */}
        <div className="absolute inset-0 z-3">
          {IMAGES.map((img, index) => {
            const roleStyle = getRoleStyle(index);
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  aspectRatio: '0.6 / 1',
                  willChange: 'transform, filter, opacity',
                  transition: 'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                  ...roleStyle
                }}
              >
                <img
                  src={img.src}
                  alt={img.title}
                  draggable={false}
                  className="w-full h-full object-contain object-bottom select-none pointer-events-none"
                />
              </div>
            );
          })}
        </div>

        {/* Bottom-left information + navigation controls */}
        <div className="absolute bottom-10 left-6 sm:bottom-16 sm:left-16 lg:left-24 z-60 max-w-[340px] text-white">
          <p className="font-extrabold uppercase tracking-widest text-[9px] bg-white/15 px-2 py-0.5 rounded inline-block mb-3 border border-white/10 font-mono">
            {IMAGES[activeIndex].title}
          </p>
          <h3 className="font-black uppercase tracking-wide text-2xl sm:text-3xl mb-3 leading-tight drop-shadow-xs">
            10-Point Standard
          </h3>
          <p className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed mb-6 drop-shadow-sm">
            {IMAGES[activeIndex].desc}
          </p>

          {/* Nav buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('prev')}
              className="w-12 h-12 rounded-full border-2 border-white/70 hover:border-white text-white flex items-center justify-center transition-all hover:bg-white/15 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous Pillar"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.25]" />
            </button>
            <button
              onClick={() => navigate('next')}
              className="w-12 h-12 rounded-full border-2 border-white/70 hover:border-white text-white flex items-center justify-center transition-all hover:bg-white/15 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next Pillar"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.25]" />
            </button>
          </div>
        </div>

        {/* Bottom-right interactive links */}
        <div className="absolute bottom-10 right-6 sm:bottom-16 sm:right-12 z-60 flex flex-col items-end gap-2 text-white text-right">
          <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">Today's Standings</span>
          <button
            onClick={scrollDownToLeaderboard}
            style={{ fontFamily: 'Anton, sans-serif' }}
            className="flex items-center gap-1.5 text-2xl sm:text-4xl tracking-tighter uppercase transition-all duration-200 hover:opacity-80 active:scale-95 outline-none cursor-pointer"
          >
            VIEW SCOREBOARD
            <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Small bouncing helper pill */}
        <div 
          onClick={scrollDownToLeaderboard}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-60 cursor-pointer hidden sm:flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity animate-bounce"
        >
          <span className="text-[8px] font-mono tracking-widest text-white/70 uppercase mb-1">Scroll down</span>
          <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center">
            <span className="text-[10px] text-white">↓</span>
          </div>
        </div>

      </div>

      {/* Main landing container: Live Scoreboard section */}
      <div 
        ref={leaderboardRef}
        className="w-full bg-zinc-50 dark:bg-[#09090b] transition-colors py-12 px-4 sm:py-20 pb-44 select-text"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Headline heading */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5 animate-pulse" />
              Live Competitions Scoreboard
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              GlowUp 10 Global Leaderboard
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              These challengers are maintaining intellectual, writing, and digital discipline. Access the challenge console to sync contacts and climb the ranks!
            </p>
          </div>

          {/* Grid components: Leaderboard (7 cols) + Activity Feed (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Leaderboard panel card */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0c0c0e]/80 border border-zinc-200 dark:border-zinc-850 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-1">
                    Scoreboard
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Standings automatically reset at midnight.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-2.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    Real-time
                  </span>
                  <button 
                    onClick={fetchPublicData}
                    className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors cursor-pointer"
                    title="Reload Rankings"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {loadingLB ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <span className="text-[10px] font-mono text-zinc-450 uppercase tracking-wider font-bold">Retrieving standings...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-xs text-zinc-500">
                  No active rankings today. Be the first to start!
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((user, idx) => {
                    const hasGlowed = user.todayPoints >= 10;
                    return (
                      <div
                        key={user.username}
                        className="p-3.5 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold leading-none ${idx === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : idx === 1 ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30' : 'bg-zinc-100 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 text-zinc-400'}`}>
                            {idx + 1}
                          </div>

                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName}
                              className={`w-9 h-9 rounded-full object-cover border-2 flex-shrink-0 ${hasGlowed ? 'border-amber-400' : 'border-zinc-200 dark:border-zinc-850'}`}
                            />
                            
                            <div className="min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-semibold truncate block text-zinc-800 dark:text-zinc-100">
                                {user.displayName}
                              </span>
                              {user.statusMessage && (
                                <p className="text-[10.5px] text-zinc-450 dark:text-zinc-500 truncate mt-0.5">
                                  "{user.statusMessage}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold font-mono ${hasGlowed ? 'text-amber-500' : 'text-zinc-800 dark:text-zinc-250'}`}>
                              {user.todayPoints < 10 ? `0${user.todayPoints}` : user.todayPoints} pts
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
                              🔥 {user.streak < 10 ? `0${user.streak}` : user.streak}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Public Activity feed card */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0c0c0e]/80 border border-zinc-200 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-1">
                  Weekly Habit Flow
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Real-time completions logged from Neon database.
                </p>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {loadingLB ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-500">
                    No recent completions. Set the bar!
                  </div>
                ) : (
                  activities.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start select-none">
                      <img
                        src={item.avatarUrl}
                        alt={item.displayName}
                        className="w-7 h-7 rounded-full object-cover mt-0.5 border border-zinc-200 dark:border-zinc-800"
                      />
                      
                      <div className="flex-1 min-w-0 font-sans">
                        <div className="text-xs text-zinc-600 dark:text-zinc-350 leading-tight">
                          <span className="font-bold text-zinc-800 dark:text-zinc-100">
                            {item.displayName}
                          </span>{' '}
                          {item.type === 'streak' ? (
                            <span className="text-amber-500 font-medium">{item.message}</span>
                          ) : item.type === 'nudge' ? (
                            <span className="text-indigo-500 dark:text-indigo-400 font-medium">{item.message}</span>
                          ) : (
                            <>
                              completed <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.taskName}</span>{' '}
                              <span className="text-indigo-400 font-bold font-mono text-[10px]">
                                +{item.points} pts
                              </span>
                            </>
                          )}
                        </div>
                        
                        <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 text-center">
                <span className="block text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">
                  Secure Validation
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  Anti-cheat focus rules are active on all challenge sheets.
                </p>
              </div>
            </div>

          </div>

          {/* Prompt action card at bottom */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 border border-indigo-500/25 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h4 className="text-lg font-bold text-zinc-805 dark:text-white">
                Ready to take the GlowUp 10 Challenge?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                Commit to hitting exactly 10 points daily through intellectual, physical, and digital boundaries. Compare logs with your network.
              </p>
            </div>
            <button
              onClick={onEnterApp}
              className="px-6 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Start the Challenge Now
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
