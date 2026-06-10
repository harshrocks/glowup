/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Users, Calendar, Sparkles, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SimulationControlsProps {
  currentDate: string;
  onSetDate: (date: string) => void;
  onSimulateFriendActivity: () => void;
  onTriggerRandomNudge: () => void;
  onHardReset: () => void;
}

export default function SimulationControls({
  currentDate,
  onSetDate,
  onSimulateFriendActivity,
  onTriggerRandomNudge,
  onHardReset,
}: SimulationControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<string | null>(null);

  const triggerAnim = (message: string) => {
    setSuccessAnimation(message);
    setTimeout(() => setSuccessAnimation(null), 3000);
  };

  const handleDayShift = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    onSetDate(dateStr);
    triggerAnim(`Time traveled to ${dateStr}!`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Simulation floating toggle button */}
      <button
        id="sandbox-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 border border-slate-700/60 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all font-mono text-[11px] font-bold select-none cursor-pointer"
      >
        <Cpu className={`w-4 h-4 text-indigo-400 ${isOpen ? 'animate-spin' : ''}`} />
        {isOpen ? 'Close Sandbox' : 'Sandbox Console'}
      </button>

      {/* Expanded Sandbox console */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`absolute bottom-14 right-0 w-80 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-2xl space-y-4`}
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-850 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                  GLOWUP SANDBOX HUB
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Simulate dates and peer interactions instantly to test leaderboard mechanics.
                </p>
              </div>
            </div>

            {/* Success Micro anim notifier */}
            <AnimatePresence>
              {successAnimation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {successAnimation}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Time travel section */}
            <div className="space-y-1.5">
              <label className="block text-[9.5px] font-mono tracking-wider font-bold text-slate-450 dark:text-slate-500 uppercase">
                ⏰ Date travel (Test Hist. Charts)
              </label>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDayShift(-1)}
                  className="flex-1 py-1.5 text-center text-[10.5px] font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  -1 Day
                </button>
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">
                  {currentDate}
                </div>
                <button
                  onClick={() => handleDayShift(1)}
                  className="flex-1 py-1.5 text-center text-[10.5px] font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  +1 Day
                </button>
              </div>
            </div>

            {/* Simulate friends activities */}
            <div className="space-y-1.5">
              <label className="block text-[9.5px] font-mono tracking-wider font-bold text-slate-450 dark:text-slate-500 uppercase">
                👥 Peer Activities
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onSimulateFriendActivity();
                    triggerAnim('Alex logged Book Reading!');
                  }}
                  className="py-1.5 text-center text-[10.5px] font-mono font-bold rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/50 transition-colors"
                >
                  Peer Activity
                </button>
                <button
                  onClick={() => {
                    onTriggerRandomNudge();
                    triggerAnim('Received a nudge alert!');
                  }}
                  className="py-1.5 text-center text-[10.5px] font-mono font-bold rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 transition-colors"
                >
                  Get Nudged
                </button>
              </div>
            </div>

            {/* Clear database */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 absolute-bottom">
              <button
                onClick={() => {
                  onHardReset();
                  triggerAnim('All points & logs reset.');
                }}
                className="w-full py-1.5 text-center text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Hard Reset Database
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
