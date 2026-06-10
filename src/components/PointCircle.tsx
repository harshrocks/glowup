/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award, Crown, Sparkles, TrendingUp, Compass, Target } from 'lucide-react';

interface PointCircleProps {
  points: number;
  goal: number;
  streak: number;
}

export default function PointCircle({ points, goal, streak }: PointCircleProps) {
  const percentage = Math.min((points / goal) * 100, 100);
  const isGlowCompleted = points >= goal;

  // SVG parameters for futuristic circular visualizer
  const radius = 96;
  const strokeWidthActive = 12;
  const strokeWidthBackground = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Calculate coordinates for visual milestone ticks around the dial (10 ticks for 10 goal points)
  const ticksCount = 10;
  const tickAngles = Array.from({ length: ticksCount }, (_, i) => (i * 360) / ticksCount - 90);

  return (
    <div className="flex flex-col items-center justify-between p-6 sm:p-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-md rounded-3xl relative overflow-hidden h-full group transition-all duration-300">
      
      {/* Subtle Ambient HUD Grid lines instead of chaotic colored gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(228,228,231,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(228,228,231,0.15)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(39,39,42,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,39,42,0.18)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-60" />

      {/* Futuristic Header Tag */}
      <div className="w-full flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-zinc-500 dark:text-zinc-400">
            Performance Core
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isGlowCompleted ? 'bg-amber-500 animate-ping' : 'bg-indigo-500 animate-pulse'}`} />
          <span className="text-[9px] font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400">
            {isGlowCompleted ? 'Goal Locked' : 'Tracking'}
          </span>
        </div>
      </div>

      {/* Circle HUD Wrapper */}
      <div className="relative flex items-center justify-center w-60 h-60 sm:w-64 sm:h-64 select-none z-10">
        {/* Subtle background radar sweep aura */}
        <div className="absolute inset-2 rounded-full border border-dashed border-zinc-250/60 dark:border-zinc-800/40 animate-spin-slow opacity-50 pointer-events-none" />

        <svg className="w-full h-full rotate-270 relative z-10" viewBox="0 0 220 220">
          {/* Subtle Outer Tick Arcs and Dots */}
          <g className="opacity-60 dark:opacity-40">
            {tickAngles.map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              // Coordinates for tick line segments
              const x1 = 110 + (radius + 8) * Math.cos(rad);
              const y1 = 110 + (radius + 8) * Math.sin(rad);
              const x2 = 110 + (radius + 12) * Math.cos(rad);
              const y2 = 110 + (radius + 12) * Math.sin(rad);
              // Active tick color condition
              const isTickReached = points >= (i + 1);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isTickReached ? (isGlowCompleted ? '#f59e0b' : '#6366f1') : '#e4e4e7'}
                  strokeWidth={isTickReached ? 2.5 : 1}
                  className="transition-all duration-500"
                />
              );
            })}
          </g>

          {/* Underlay Shadow Track */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-850"
            strokeWidth={strokeWidthBackground}
          />

          {/* Active Dynamic Fill Track - Solid Colors for Glassmorphic HUD style */}
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke={isGlowCompleted ? '#f59e0b' : '#6366f1'}
            strokeWidth={strokeWidthActive}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeDashoffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            className="drop-shadow-[0_2px_4px_rgba(99,102,241,0.15)] dark:drop-shadow-[0_2px_8px_rgba(99,102,241,0.1)]"
          />
        </svg>

        {/* Center Point Figures */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={points}
            className="flex flex-col items-center text-center px-4"
          >
            {isGlowCompleted ? (
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="p-1 rounded-full bg-amber-500/10 select-none mb-0.5"
              >
                <Crown className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              </motion.div>
            ) : (
              <div className="p-1 rounded-full bg-indigo-500/5 select-none mb-0.5">
                <Award className="w-5.5 h-5.5 text-indigo-500 dark:text-indigo-400 opacity-80" />
              </div>
            )}

            {/* Giant Points Figure with pristine, clean contrasting solid colors */}
            <div className="flex items-baseline justify-center">
              <span className={`text-5xl sm:text-6xl font-black leading-none tracking-tighter ${
                isGlowCompleted 
                  ? 'text-amber-550 dark:text-amber-500' 
                  : 'text-zinc-850 dark:text-zinc-50'
              }`}>
                {points}
              </span>
              <span className="text-zinc-400 dark:text-zinc-550 text-lg font-bold ml-1">
                /{goal}
              </span>
            </div>

            {/* Realtime progress micro percentage pill */}
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-[9px] font-mono rounded-full font-bold tracking-wider uppercase ${
                isGlowCompleted 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              }`}>
                {percentage.toFixed(0)}% Finished
              </span>
            </div>
            
            <p className="text-zinc-400 dark:text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-2 font-mono">
              Points Accrued
            </p>
          </motion.div>
        </div>
      </div>

      {/* Progress & Responsive Streak Indicators */}
      <div className="mt-6 text-center z-10 w-full flex-1 flex flex-col justify-end">
        {isGlowCompleted ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex self-center items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-2xs select-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>10-Point Glow Restored! 🚀</span>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-xs leading-relaxed max-w-sm mx-auto">
              Secure <span className="text-indigo-600 dark:text-indigo-400 font-bold">{goal - points} points</span> more to unlock your official intellectual glow-up threshold today.
            </p>
            
            {/* Progress Ticker Miniature Track */}
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden max-w-xs mx-auto">
              <div 
                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Triple grid metrics at bottom */}
        <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-850 grid grid-cols-2 gap-3 w-full">
          <div className="bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/50 flex flex-col items-center justify-center transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30">
            <span className="flex items-center gap-1 text-[8.5px] font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-555" />
              Day Streak
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/50 flex flex-col items-center justify-center transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30">
            <span className="flex items-center gap-1 text-[8.5px] font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
              <Compass className="w-3 h-3 text-indigo-500 animate-pulse whitespace-nowrap" />
              Status
            </span>
            <span className={`text-xs sm:text-xs font-bold font-mono uppercase truncate max-w-full ${isGlowCompleted ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {isGlowCompleted ? 'Glow Active' : 'Progressing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
