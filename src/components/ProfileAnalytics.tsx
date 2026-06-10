/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Calendar, Award, Zap, Heart, TrendingUp, BookOpen, BrainCircuit, Edit2, Check, LogOut, Camera, Image, Link, Upload, Sparkles } from 'lucide-react';
import { DailyLog, TaskCategory } from '../types';

interface ProfileAnalyticsProps {
  logs: DailyLog[];
  streak: number;
  bestStreak: number;
  currentUser?: { username: string; displayName: string; avatarUrl: string; statusMessage?: string } | null;
  onUpdateStatus?: (status: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
  onLogout?: () => void;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Intellectual: '#6366f1', // Indigo
  Writing: '#10b981',      // Emerald
  Focus: '#0ea5e9',        // Sky
  Body: '#f43f5e'          // Rose
};

export default function ProfileAnalytics({ 
  logs, 
  streak, 
  bestStreak,
  currentUser,
  onUpdateStatus,
  onUpdateAvatar,
  onLogout
}: ProfileAnalyticsProps) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(currentUser?.statusMessage || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarInput, setAvatarInput] = useState(currentUser?.avatarUrl || '');
  const [customSeed, setCustomSeed] = useState('');

  const PRESET_AVATARS = [
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Felix',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Jack',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Sophia',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Mia',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Leo',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Luna',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Zoe',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Milo',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Coco',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Daisy',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Ginger',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Peanut',
    'https://api.dicebear.com/7.x/open-peeps/svg?seed=Bella'
  ];

  const handleSaveBio = () => {
    if (onUpdateStatus) {
      onUpdateStatus(editedBio);
    }
    setIsEditingBio(false);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarInput(url);
    if (onUpdateAvatar) {
      onUpdateAvatar(url);
    }
    setIsEditingAvatar(false);
  };

  const handleSaveCustomAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarInput.trim() && onUpdateAvatar) {
      onUpdateAvatar(avatarInput.trim());
    }
    setIsEditingAvatar(false);
  };

  // 1. Calculate category breakdowns
  // We look through all completed tasks across logs, count their point totals by category
  const categorySummary: Record<TaskCategory, number> = {
    Intellectual: 0,
    Writing: 0,
    Focus: 0,
    Body: 0
  };

  let totalLogsPoints = 0;

  logs.forEach(log => {
    log.completedTaskIds.forEach(taskId => {
      if (taskId === 'reading') {
        categorySummary['Intellectual'] += 2;
      } else if (taskId === 'long_form') {
        categorySummary['Intellectual'] += 1;
      } else if (taskId === 'academic') {
        categorySummary['Intellectual'] += 1;
      } else if (taskId === 'feynman') {
        categorySummary['Intellectual'] += 1;
      } else if (taskId === 'writing') {
        categorySummary['Writing'] += 2;
      } else if (taskId === 'digital_boundary') {
        categorySummary['Focus'] += 1;
      } else if (taskId === 'deep_work') {
        categorySummary['Focus'] += 1;
      } else if (taskId === 'sleep') {
        categorySummary['Body'] += 2;
      } else if (taskId === 'physical') {
        categorySummary['Body'] += 1;
      }
    });
  });

  const chartData = Object.entries(categorySummary).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name as TaskCategory]
  })).filter(item => item.value > 0);

  // Fallback defaults if no logs recorded yet
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Intellectual', value: 5, color: '#6366f1' },
    { name: 'Writing', value: 2, color: '#10b981' },
    { name: 'Focus', value: 2, color: '#0ea5e9' },
    { name: 'Body', value: 3, color: '#f43f5e' }
  ];

  totalLogsPoints = displayChartData.reduce((acc, curr) => acc + curr.value, 0);

  // 2. Heatmap calculations
  // Show a 28-day grid of past days.
  // We'll list the past 28 dates chronologically
  const heatmapCells = [];
  const today = new Date();
  
  for (let i = 27; i >= 0; i--) {
    const historicalDate = new Date();
    historicalDate.setDate(today.getDate() - i);
    const dateStr = historicalDate.toISOString().split('T')[0];
    
    // Find log matching date
    const dayLog = logs.find(log => log.date === dateStr);
    const score = dayLog ? dayLog.pointsEarned : 0;
    
    heatmapCells.push({
      dateString: dateStr,
      dayLabel: historicalDate.toLocaleDateString(undefined, { weekday: 'short' }),
      dateLabel: historicalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: score,
      metGoal: score >= 10
    });
  }

  // 3. Overall Stats counters
  const totalDays = logs.length;
  const standardMetCount = logs.filter(log => log.pointsEarned >= 10).length;
  const consistencyRate = totalDays > 0 ? (standardMetCount / totalDays) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Profile Cover Card */}
      {currentUser && (
        <div className="space-y-4">
          <div id="user-profile-header-card" className="bg-zinc-50/20 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-250 dark:border-zinc-850 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full sm:w-auto">
              {/* Customizable Avatar Wrapper */}
              <div 
                className="relative group cursor-pointer select-none"
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                title="Change Profile Picture"
              >
                <img 
                  referrerPolicy="no-referrer"
                  src={currentUser.avatarUrl} 
                  alt={currentUser.displayName} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-505/20 transition-all duration-300 group-hover:brightness-75 group-hover:scale-102"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-5 h-5 text-zinc-100" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1 rounded-full shadow-md">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl font-bold text-zinc-850 dark:text-zinc-100 font-sans">
                    {currentUser.displayName}
                  </h2>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-mono uppercase bg-indigo-500/15 text-indigo-500 rounded-md font-bold self-center">
                    Level 10 Challenger
                  </span>
                </div>
                
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  @{currentUser.username}
                </p>
                
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  {isEditingBio ? (
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="text" 
                        value={editedBio} 
                        onChange={(e) => setEditedBio(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-850 dark:text-zinc-100 outline-none w-48 font-sans focus:ring-1 focus:ring-indigo-500"
                        placeholder="Write bio status..."
                      />
                      <button 
                        onClick={handleSaveBio}
                        className="p-1 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/bio cursor-pointer" onClick={() => {
                      setEditedBio(currentUser.statusMessage || '');
                      setIsEditingBio(true);
                    }}>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                        "{currentUser.statusMessage || 'Ready to glow up!'}"
                      </span>
                      <button 
                        className="p-0.5 rounded text-zinc-400 hover:text-zinc-350 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 opacity-60 group-hover/bio:opacity-100" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold uppercase tracking-wider font-mono select-none transition-all ${
                  isEditingAvatar 
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Change Picture
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer text-xs font-semibold uppercase tracking-wider font-mono select-none"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Profile Picture Personalizer Sub-Drawer */}
          {isEditingAvatar && (
            <div className="bg-zinc-50/10 dark:bg-zinc-950/40 p-5 rounded-3xl border border-indigo-500/20 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs uppercase tracking-widest font-bold text-zinc-455 dark:text-zinc-400">
                    Profile Avatar Personalizer
                  </h3>
                </div>
                <span className="text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-bold">
                  High Resolution
                </span>
              </div>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Choose one of our premium preset doodle avatars or generate a completely custom doodle by entering a unique seed word!
              </p>

              {/* Section 1: Presets */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                    1. Choose from preloaded cute presets
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PRESET_AVATARS.map((url, idx) => {
                    const isSelected = currentUser.avatarUrl === url;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(url)}
                        className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 outline-none ${
                          isSelected 
                            ? 'border-indigo-500 scale-105 shadow-md' 
                            : 'border-zinc-200 dark:border-zinc-805 hover:border-indigo-500/40 hover:scale-102'
                        }`}
                      >
                        <img 
                          referrerPolicy="no-referrer"
                          src={url} 
                          alt={`Preset option ${idx + 1}`} 
                          className="w-full h-full object-cover animate-fade-in"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="h-px bg-zinc-200/60 dark:bg-zinc-900 flex-1" />
                <span className="text-[9px] font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
                  Or design your own
                </span>
                <div className="h-px bg-zinc-200/60 dark:bg-zinc-900 flex-1" />
              </div>

              {/* Section 2: Doodle Generator */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                    2. Type a seed word to generate a custom doodle
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-50/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80">
                  {/* Live preview */}
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 bg-white flex items-center justify-center shadow-inner">
                    <img
                      src={`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(customSeed.trim() || 'happy')}`}
                      alt="Custom preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 w-full space-y-2">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                      </span>
                      <input
                        type="text"
                        value={customSeed}
                        onChange={(e) => setCustomSeed(e.target.value)}
                        placeholder="Type any word (e.g. your name, magic word, vibe...)"
                        className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const generatedUrl = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(customSeed.trim() || 'happy')}`;
                        handleSelectPreset(generatedUrl);
                      }}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer select-none"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply Generated Doodle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overview stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div id="stat-card-streak" className="p-4 bg-zinc-50/20 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center select-none">
          <span className="block text-[10px] font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-widest font-bold">
            Current streak
          </span>
          <span className="block text-2xl font-semibold text-zinc-800 dark:text-zinc-100 font-sans mt-1">
            🔥 {streak} {streak === 1 ? 'day' : 'days'}
          </span>
          <p className="text-[10.5px] text-indigo-500 font-medium mt-1">
            Keep it glowing!
          </p>
        </div>

        <div id="stat-card-best-streak" className="p-4 bg-zinc-50/20 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center select-none">
          <span className="block text-[10px] font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-widest font-bold">
            All-Time Best
          </span>
          <span className="block text-2xl font-semibold text-zinc-800 dark:text-zinc-100 font-sans mt-1">
            🏆 {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
          </span>
          <p className="text-[10.5px] text-zinc-400 font-medium mt-1">
            Historical top score
          </p>
        </div>

        <div id="stat-card-glow-met" className="p-4 bg-zinc-50/20 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center select-none">
          <span className="block text-[10px] font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-widest font-bold">
            Days Met Goal
          </span>
          <span className="block text-2xl font-semibold text-indigo-500 dark:text-indigo-400 font-sans mt-1">
            ✨ {standardMetCount} / {totalDays}
          </span>
          <p className="text-[10.5px] text-indigo-400 font-medium mt-1">
            Target met total
          </p>
        </div>

        <div id="stat-card-consistency" className="p-4 bg-zinc-50/20 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center select-none">
          <span className="block text-[10px] font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-widest font-bold">
            Consistency
          </span>
          <span className="block text-2xl font-semibold text-zinc-800 dark:text-zinc-100 font-sans mt-1">
            📈 {consistencyRate.toFixed(0)}%
          </span>
          <p className="text-[10.5px] text-zinc-400 font-medium mt-1">
            Sustained rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Habit Breakdown PIE CHART */}
        <div id="habit-breakdown-panel" className="lg:col-span-5 bg-zinc-50/20 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-250 dark:border-zinc-850 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-1">
              Glow Categories
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Accumulated point distribution.
            </p>
          </div>

          <div className="relative h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} pts`, 'Total Points']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#f4f4f5',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Display Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
                {totalLogsPoints < 10 ? `0${totalLogsPoints}` : totalLogsPoints}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                Total Pts
              </span>
            </div>
          </div>

          {/* Simple Legend lists */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-zinc-200 dark:border-zinc-850">
            {displayChartData.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate font-sans text-[11.5px]">
                  {entry.name}: <strong className="font-mono text-zinc-850 dark:text-zinc-200">{entry.value} pts</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div id="calendar-heatmap-panel" className="lg:col-span-7 bg-zinc-50/20 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-250 dark:border-zinc-850 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-2">
              Weekly Habit Flow
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Plotting daily score milestones. Indigo represents hitting your 10-point daily threshold.
            </p>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-7 gap-3 py-4 mt-2">
            {/* Headers headers: Mon, Tue, etc */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                {day}
              </div>
            ))}

            {heatmapCells.map((cell) => {
              const bgClass = cell.score >= 10
                ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]'
                : cell.score > 0
                  ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/10'
                  : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 text-zinc-500';

              return (
                <div
                  key={cell.dateString}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${bgClass} group relative`}
                >
                  <span className="text-[11px] font-semibold font-mono leading-none">
                    {cell.dateString.split('-')[2]}
                  </span>
                  
                  {/* Hover tooltips */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30">
                    <div className="bg-zinc-900 text-zinc-100 text-[10px] px-2.5 py-1.5 rounded-lg border border-zinc-800 whitespace-nowrap shadow-md text-center max-w-[150px]">
                      <span className="block font-bold">{cell.dateLabel}</span>
                      <span className="block font-mono text-indigo-400 mt-0.5">{cell.score} pts logged</span>
                    </div>
                    <div className="w-2 h-1 bg-zinc-900 border-x border-b border-r-0 border-zinc-800 rotate-45 -mt-1" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-850 pt-3">
            <span className="flex items-center gap-1">
              🎓 Focus + Movement + Sleep = Compound Glow.
            </span>
            <div className="flex gap-2 items-center">
              <span>0 pts</span>
              <span className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-900" />
              <span className="w-3 h-3 rounded bg-indigo-900/30" />
              <span className="w-3 h-3 rounded bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
              <span>10+ pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
