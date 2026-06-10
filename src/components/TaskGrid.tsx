/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Film, 
  FileText, 
  PenTool, 
  Sparkles, 
  Smartphone, 
  Cpu, 
  Moon, 
  Flame, 
  Check, 
  Pen, 
  Info,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { Task } from '../types';

interface TaskGridProps {
  tasks: Task[];
  completedTaskIds: string[];
  writingText: string;
  writingWordsCount: number;
  onToggleTask: (taskId: string) => void;
  onChangeWriting: (text: string, count: number) => void;
}

const renderTaskIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Clapperboard': return <Film className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'PenTool': return <PenTool className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'SmartphoneCheck': return <Smartphone className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Moon': return <Moon className={className} />;
    case 'Flame': return <Flame className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const countWords = (text: string) => {
  const cleanText = text.trim();
  if (!cleanText) return 0;
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
};

export default function TaskGrid({
  tasks,
  completedTaskIds,
  writingText,
  writingWordsCount,
  onToggleTask,
  onChangeWriting
}: TaskGridProps) {
  const [isWritingOpen, setIsWritingOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleWritingTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = countWords(text);
    onChangeWriting(text, words);
  };

  const isCompleted = (taskId: string) => completedTaskIds.includes(taskId);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Intellectual':
        return {
          bg: 'bg-indigo-50/70 dark:bg-indigo-950/25',
          border: 'border-indigo-100 dark:border-indigo-900/45',
          text: 'text-indigo-600 dark:text-indigo-400',
          badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
        };
      case 'Writing':
        return {
          bg: 'bg-emerald-50/70 dark:bg-emerald-950/25',
          border: 'border-emerald-100 dark:border-emerald-900/45',
          text: 'text-emerald-600 dark:text-emerald-400',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        };
      case 'Focus':
        return {
          bg: 'bg-sky-50/70 dark:bg-sky-950/25',
          border: 'border-sky-100 dark:border-sky-900/45',
          text: 'text-sky-600 dark:text-sky-400',
          badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
        };
      case 'Body':
        return {
          bg: 'bg-rose-50/70 dark:bg-rose-950/25',
          border: 'border-rose-100 dark:border-rose-900/45',
          text: 'text-rose-600 dark:text-rose-400',
          badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-900',
          border: 'border-slate-100 dark:border-slate-800',
          text: 'text-slate-600 dark:text-slate-450',
          badge: 'bg-slate-100 text-slate-750 dark:bg-slate-900'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Headings */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-1">
            Today's High-Leverage Tasks
          </h2>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Log points towards your 10-point intellectual glow-up goal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isWritingTask = task.id === 'writing';
          const completed = isCompleted(task.id);
          const styles = getCategoryStyles(task.category);

          if (isWritingTask) {
            // Specialized Writing Card
            const writingCompPercent = Math.min((writingWordsCount / 200) * 100, 100);
            return (
              <div
                key={task.id}
                id="task-card-writing"
                className={`col-span-1 md:col-span-2 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  completed 
                    ? 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-350 dark:border-zinc-800 border-l-4 border-l-indigo-500' 
                    : isWritingOpen
                      ? 'bg-zinc-100/90 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-700 shadow-md'
                      : 'bg-zinc-50/30 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/80 dark:hover:border-zinc-700 hover:border-zinc-300'
                }`}
              >
                {/* Header portion */}
                <div 
                  className="p-5 flex items-start gap-4 cursor-pointer select-none"
                  onClick={() => setIsWritingOpen(!isWritingOpen)}
                >
                  <div className={`p-3 rounded-xl transition-colors ${completed ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-850 ' + styles.text}`}>
                    {renderTaskIcon(task.iconName, "w-6 h-6")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono ${styles.badge}`}>
                        {task.category}
                      </span>
                      <span className="text-indigo-500 dark:text-indigo-400 flex items-center gap-0.5 text-xs font-semibold font-mono">
                        <Award className="w-3.5 h-3.5" />
                        +{task.points} PTS
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mt-1.5 flex items-center justify-between">
                      {task.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      {task.condition}
                    </p>
                  </div>

                  {/* Completion and Toggler controls */}
                  <div className="flex items-center gap-3">
                    {completed ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                        ✕
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-sans">
                        {writingWordsCount}/200 words
                      </div>
                    )}
                    <button className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 transition-colors">
                      {isWritingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanding Workspace */}
                <AnimatePresence>
                  {isWritingOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20"
                    >
                      <div className="p-5 space-y-4">
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                          {task.description} Write 200 words or more about your day, lessons learned, or internal thoughts to secure your pts.
                        </p>

                        <div className="relative">
                          <textarea
                            className="w-full h-40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans resize-y"
                            placeholder="Type or paste your writing log here... Let your ideas flow freely."
                            value={writingText}
                            onChange={handleWritingTextChange}
                          />

                          {/* Word Count Indicator bottom panel */}
                          <div className="absolute right-3.5 bottom-3.5 flex items-center gap-3 bg-white/90 dark:bg-zinc-900/90 py-1.5 px-3 rounded-lg border border-zinc-150 dark:border-zinc-800 shadow-2xs">
                            <svg className="w-5 h-5 rotate-270">
                              <circle
                                cx="10"
                                cy="10"
                                r="8"
                                fill="transparent"
                                stroke="#cbd5e1"
                                strokeWidth="2.5"
                                className="opacity-20"
                              />
                              <circle
                                cx="10"
                                cy="10"
                                r="8"
                                fill="transparent"
                                stroke={completed ? '#10b981' : '#6366f1'}
                                strokeWidth="2.5"
                                strokeDasharray={2 * Math.PI * 8}
                                strokeDashoffset={(2 * Math.PI * 8) - (writingCompPercent / 100) * (2 * Math.PI * 8)}
                              />
                            </svg>
                            <span className={`text-xs font-bold font-mono ${completed ? 'text-emerald-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {writingWordsCount} words
                            </span>
                          </div>
                        </div>

                        {completed ? (
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold bg-indigo-500/10 dark:bg-indigo-500/5 px-3 py-2 rounded-lg border border-indigo-500/20">
                            <Check className="w-4 h-4 stroke-[3]" />
                            Perfect! Task completed, +2 Glow Points logged! Keep writing if you desire.
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-450 dark:text-zinc-500 text-xs font-medium">
                            <Pen className="w-3.5 h-3.5 animate-pulse" />
                            Need {Math.max(0, 200 - writingWordsCount)} more words to claim 2 points.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // Standard Toggleable Binary Task
          return (
            <div
              key={task.id}
              id={`task-card-${task.id}`}
              onClick={() => onToggleTask(task.id)}
              className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 select-none cursor-pointer group ${
                completed
                  ? 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-350 dark:border-zinc-800 border-l-4 border-l-indigo-500 shadow-none'
                  : 'bg-zinc-50/20 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-900 hover:border-indigo-300/60 dark:hover:border-indigo-900/30 shadow-2xs hover:shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors ${completed ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-850 ' + styles.text}`}>
                {renderTaskIcon(task.iconName, "w-6 h-6")}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono ${styles.badge}`}>
                    {task.category}
                  </span>
                  <span className="text-indigo-500 dark:text-indigo-400 flex items-center gap-0.5 text-xs font-semibold font-mono">
                    <Award className="w-3.5 h-3.5" />
                    +{task.points} PTS
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 transition-colors group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
                    {task.name}
                  </h3>
                  <button 
                    id={`task-info-btn-${task.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip(showTooltip === task.id ? null : task.id);
                    }}
                    className="p-0.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  {task.condition}
                </p>

                {/* Hover Tooltip description toggle */}
                <AnimatePresence>
                  {showTooltip === task.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 bg-zinc-150 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
                    >
                      {task.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Action element */}
              <div className="flex-shrink-0 self-center">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all ${
                  completed
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-xs'
                    : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-250 dark:border-zinc-800 group-hover:border-indigo-400 text-transparent'
                }`}>
                  ✓
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
