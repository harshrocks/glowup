/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Calendar, Award, Zap, Heart, TrendingUp, BookOpen, BrainCircuit, Edit2, Check, LogOut, Camera, Image, Link, Upload } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (.png, .jpg, .jpeg, .webp, .gif) are supported.');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) { // 1.5MB max for reasonable base64 speed and postgres storage limits
      setUploadError('File size is too large. Please select an image under 1.5MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (onUpdateAvatar) {
        onUpdateAvatar(result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the target image file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Tech Style Accent
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Executive Minimalist
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Cheerful Glow
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Electric Indigo Neon
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', // Soft Classic Look
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', // Dynamic Creative Artist
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', // Artistic Sunset Accent
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'  // Clean Standard Blue
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
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-550 dark:text-indigo-400' 
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
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
                Personalize your profile identity. Drag and drop any custom picture, select a file from your device, or choose from our designer presets.
              </p>

              {/* Intuitive Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById('avatar-file-upload-input')?.click()}
                className={`relative px-4 py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.01]'
                    : 'border-zinc-250 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 hover:border-indigo-500/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                <input
                  id="avatar-file-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <span className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest animate-pulse">
                      Transforming Image...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-550 dark:text-indigo-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Drop your picture here or <span className="text-indigo-550 dark:text-indigo-400 underline decoration-indigo-500/40">browse device</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                        PNG, JPG, WEBP, GIF (Max 1.5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload error feedback */}
              {uploadError && (
                <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium">
                  ⚠️ {uploadError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <div className="h-px bg-zinc-200/60 dark:bg-zinc-900 flex-1" />
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Or select a premium preset
                </span>
                <div className="h-px bg-zinc-200/60 dark:bg-zinc-900 flex-1" />
              </div>

              {/* Preset avatars list */}
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
                        className="w-full h-full object-cover"
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

              {/* Custom Image Address Input Form */}
              <form onSubmit={handleSaveCustomAvatar} className="pt-3 border-t border-zinc-200/60 dark:border-zinc-900 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Link className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="Paste custom absolute web image address (e.g. Unsplash dynamic URL)"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-550 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-550 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer select-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Custom Picture
                </button>
              </form>
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
                <span className="text-zinc-650 dark:text-zinc-300 font-medium truncate font-sans text-[11.5px]">
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
