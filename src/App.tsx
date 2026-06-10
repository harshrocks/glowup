/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Users, 
  TrendingUp, 
  Sun, 
  Moon, 
  Flame, 
  Bell, 
  Crown, 
  X,
  Share2,
  Settings,
  HelpCircle,
  Compass,
  User
} from 'lucide-react';

import { DailyLog, Friend, ActivityItem, Task } from './types';
import { GLOWUP_TASKS, INITIAL_FRIENDS, INITIAL_ACTIVITY_FEED } from './data';
import PointCircle from './components/PointCircle';
import TaskGrid from './components/TaskGrid';
import SocialHub from './components/SocialHub';
import ProfileAnalytics from './components/ProfileAnalytics';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import { playCuteClick, playCuteSuccess, playCuteVictory, playYaySound } from './utils/audio';
import { triggerConfetti } from './utils/confetti';

// Streak calculator algorithm
function computeStreak(logs: DailyLog[], referenceDateStr: string): { current: number; best: number } {
  const getLogPts = (dStr: string) => {
    const log = logs.find(l => l.date === dStr);
    return log ? log.pointsEarned : 0;
  };

  const getFormattedDate = (d: Date) => d.toISOString().split('T')[0];

  const checkDate = new Date(referenceDateStr);
  const todayStr = getFormattedDate(checkDate);
  
  const hitToday = getLogPts(todayStr) >= 10;
  
  const yesterday = new Date(checkDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const hitYesterday = getLogPts(getFormattedDate(yesterday)) >= 10;

  let currentStreak = 0;

  if (!hitToday && !hitYesterday) {
    currentStreak = 0;
  } else {
    let startCountingDate = hitToday ? new Date(todayStr) : new Date(getFormattedDate(yesterday));
    // Cap loops to avoid execution freeze
    let safetyCounter = 0;
    while (safetyCounter < 500) {
      const dateStr = getFormattedDate(startCountingDate);
      if (getLogPts(dateStr) >= 10) {
        currentStreak++;
        startCountingDate.setDate(startCountingDate.getDate() - 1);
      } else {
        break;
      }
      safetyCounter++;
    }
  }

  // Calculate historical maximum streak
  let bestStreak = 0;
  let tempStreak = 0;
  
  const chronologicalLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  
  if (chronologicalLogs.length > 0) {
    let prevDate: Date | null = null;
    
    chronologicalLogs.forEach(log => {
      const curDate = new Date(log.date);
      const hitGoal = log.pointsEarned >= 10;
      
      if (hitGoal) {
        if (prevDate === null) {
          tempStreak = 1;
        } else {
          const diffTime = Math.abs(curDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        prevDate = curDate;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
        prevDate = null;
      }
    });
  }

  return {
    current: currentStreak,
    best: Math.max(bestStreak, currentStreak)
  };
}

export default function App() {
  // Theme & tab selection state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('glowup_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'social' | 'analytics'>('dashboard');

  // Simulation active date
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // DB States
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string }[]>([]);

  // User Authentication States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('glowup_jwt_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  const [lastLogTime, setLastLogTime] = useState<number>(0);

  // Authenticate session on bootup
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setIsLoadingProfile(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        const resp = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (resp.ok) {
          const profile = await resp.json();
          setCurrentUser(profile);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('glowup_jwt_token');
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Boot authorization check failed:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    checkSession();
  }, [token]);

  // Synchronize database records when authenticated session is active
  const fetchDbRecords = async () => {
    if (!token) return;
    try {
      // 1. Logs
      const logsResp = await fetch('/api/user/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsResp.ok) {
        const savedLogs = await logsResp.json();
        setLogs(savedLogs);
      }

      // 2. Leaderboard (maps bot standins + real user on current active date)
      const lbResp = await fetch(`/api/leaderboard?date=${currentDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (lbResp.ok) {
        const fullLeaderboard = await lbResp.json();
        const otherFriends = fullLeaderboard.filter((f: any) => f.username !== currentUser?.username);
        const maxStreak = Math.max(...fullLeaderboard.map((f: any) => f.streak), 0);
        
        setFriends(otherFriends.map((f: any) => ({
          ...f,
          isHighestStreak: f.streak > 0 && f.streak === maxStreak,
          nudgeCount: 0
        })));
      }

      // 3. Global Activity list
      const actResp = await fetch('/api/activities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (actResp.ok) {
        setActivities(await actResp.json());
      }
    } catch (e) {
      console.error('Failed to query backend datasets:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchDbRecords();

      const interval = setInterval(() => {
        fetchDbRecords();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser, currentDate]);

  // Sync theme changes to document DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('glowup_theme', theme);
  }, [theme]);

  // Read current active day's log dynamically
  const currentDayLog = useMemo(() => {
    const log = logs.find(l => l.date === currentDate);
    if (log) return log;
    return {
      date: currentDate,
      completedTaskIds: [],
      writingWordsCount: 0,
      writingText: '',
      pointsEarned: 0
    };
  }, [logs, currentDate]);

  // Compute points and streaks dynamically based on active Date
  const { currentStreak, bestStreak } = useMemo(() => {
    return computeStreak(logs, currentDate);
  }, [logs, currentDate]);

  // Show a notification toast
  const showNotificationToast = (title: string, body: string) => {
    const newNotif = {
      id: Math.random().toString(),
      title,
      body
    };
    setNotifications(prev => [newNotif, ...prev]);
    // Auto timeout
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  // Helper: Persist log changes to cloud Postgres database
  const saveLogUpdate = async (updatedLog: DailyLog, taskToggledName?: string) => {
    // Client-side local optimization to keep interface interactive and animations smooth
    const nextLogs = logs.map(l => l.date === updatedLog.date ? updatedLog : l);
    if (!logs.some(l => l.date === updatedLog.date)) {
      nextLogs.push(updatedLog);
    }
    setLogs(nextLogs);

    // Compute updated streaks instantly for UI rendering
    const { current: newStreak, best: newBest } = computeStreak(nextLogs, currentDate);

    if (token) {
      try {
        await fetch('/api/user/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            date: updatedLog.date,
            completedTaskIds: updatedLog.completedTaskIds,
            writingWordsCount: updatedLog.writingWordsCount,
            writingText: updatedLog.writingText,
            pointsEarned: updatedLog.pointsEarned,
            streak: newStreak,
            bestStreak: newBest,
            taskToggledName
          })
        });

        // Sync fresh standings dynamically in background
        const lbResp = await fetch(`/api/leaderboard?date=${currentDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lbResp.ok) {
          const lList = await lbResp.json();
          const otherFriends = lList.filter((f: any) => f.username !== currentUser?.username);
          const maxStreak = Math.max(...lList.map((f: any) => f.streak), 0);
          setFriends(otherFriends.map((f: any) => ({
            ...f,
            isHighestStreak: f.streak > 0 && f.streak === maxStreak,
            nudgeCount: 0
          })));
        }

        const actResp = await fetch('/api/activities', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (actResp.ok) {
          setActivities(await actResp.json());
        }

        if (currentUser) {
          setCurrentUser((prev: any) => ({
            ...prev,
            streak: newStreak,
            bestStreak: newBest
          }));
        }
      } catch (err) {
        console.error('Log save to backend failed:', err);
      }
    }
  };

  // Task Grid Event: Toggle standard binary tasks
  const handleToggleTask = (taskId: string) => {
    const isCompleting = !currentDayLog.completedTaskIds.includes(taskId);
    if (isCompleting) {
      const now = Date.now();
      if (now - lastLogTime < 8000) {
        showNotificationToast(
          '🔒 Focus Protection Active',
          'Deep work takes time! Please wait at least 8 seconds between completing tasks to prevent rapid-fire logging.'
        );
        return;
      }
      setLastLogTime(now);
    }

    const log = { ...currentDayLog };
    const taskObj = GLOWUP_TASKS.find(t => t.id === taskId);
    const toggledName = taskObj ? taskObj.name : undefined;
    
    // Toggle
    if (log.completedTaskIds.includes(taskId)) {
      log.completedTaskIds = log.completedTaskIds.filter(id => id !== taskId);
    } else {
      log.completedTaskIds.push(taskId);
    }

    // Recalculate score
    log.pointsEarned = getPointsForTasksAndWriting(log.completedTaskIds, log.writingWordsCount);
    
    // Trigger milestone celebration alert
    if (log.pointsEarned >= 10 && currentDayLog.pointsEarned < 10) {
      showNotificationToast('🌟 10-Point Glow Up Reached!', `Congratulations, you've unlocked today's intellectual growth score. Streak continues!`);
      playCuteVictory();
      playYaySound();
      triggerConfetti();
    } else if (log.pointsEarned > currentDayLog.pointsEarned) {
      playCuteSuccess();
    } else {
      playCuteClick();
    }

    saveLogUpdate(log, toggledName);
  };

  // Task Grid Event: Edit essay 200 words
  const handleChangeWriting = (text: string, count: number) => {
    const log = { ...currentDayLog };
    log.writingText = text;
    log.writingWordsCount = count;
    
    const wasCompleted = log.completedTaskIds.includes('writing');
    const isNowCompleted = count >= 200;

    let toggledName: string | undefined = undefined;

    if (isNowCompleted && !wasCompleted) {
      const now = Date.now();
      if (now - lastLogTime < 8000) {
        showNotificationToast(
          '🔒 Focus Protection Active',
          'Deep work takes time! Please wait at least 8 seconds before completing another task.'
        );
        return;
      }
      setLastLogTime(now);

      log.completedTaskIds.push('writing');
      toggledName = 'Essays & Journaling';
      showNotificationToast('✍️ Journaling Achievement!', 'Completed 200+ words! Hitting academic standards.');
    } else if (!isNowCompleted && wasCompleted) {
      log.completedTaskIds = log.completedTaskIds.filter(id => id !== 'writing');
    }

    log.pointsEarned = getPointsForTasksAndWriting(log.completedTaskIds, count);
    
    if (log.pointsEarned >= 10 && currentDayLog.pointsEarned < 10) {
      showNotificationToast('🌟 10-Point Glow Up Reached!', `Congratulations! Hitting daily point benchmarks.`);
      playCuteVictory();
      playYaySound();
      triggerConfetti();
    } else if (isNowCompleted && !wasCompleted) {
      playCuteSuccess();
    }

    saveLogUpdate(log, toggledName);
  };

  // Helper points counter matching PRD formulas
  const getPointsForTasksAndWriting = (completedIds: string[], writingWords: number) => {
    let pts = 0;
    GLOWUP_TASKS.forEach(t => {
      if (t.id === 'writing') {
        if (writingWords >= 200) {
          pts += t.points;
        }
      } else {
        if (completedIds.includes(t.id)) {
          pts += t.points;
        }
      }
    });
    return pts;
  };

  // Social Event: Add a custom friend
  const handleAddFriend = async (usr: string, name: string) => {
    if (token) {
      try {
        const resp = await fetch('/api/activities/nudge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ friendUsername: usr, nudgeMessage: 'added you to their competitive circle!' })
        });
        if (resp.ok) {
          showNotificationToast('➕ Added Friend', `You connected with ${name}!`);
          fetchDbRecords(); // Reload friends leaderboard and feed
        }
      } catch (err) {
        console.error('Error adding friend:', err);
      }
    }
  };

  // Social Event: Contacts synchronization
  const handleSyncContacts = () => {
    fetchDbRecords();
    showNotificationToast('📱 Contacts Synchronized', 'Dynamic real-time leaderboard updated with live network records.');
  };

  // Social Event: Send push nudge taunt
  const handleSendNudge = async (friendUsername: string, nudgeType: string, text: string) => {
    if (token) {
      try {
        const resp = await fetch('/api/activities/nudge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ friendUsername, nudgeMessage: `sent nudge: "${text}"` })
        });
        if (resp.ok) {
          showNotificationToast('🎯 Nudge Dispatched', `Nudge successfully sent to ${friendUsername}!`);
          const actResp = await fetch('/api/activities', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (actResp.ok) {
            setActivities(await actResp.json());
          }
          
          // Dynamic reply reply
          setTimeout(() => {
            showNotificationToast(`💬 Alert from ${friendUsername}`, `Nudge received! Speeding up! 🚀`);
          }, 3500);
        }
      } catch (e) {
        console.error('Nudge send failed:', e);
      }
    }
  };

  // Profile Event: Update bio status
  const handleUpdateStatus = async (status: string) => {
    if (token) {
      try {
        const resp = await fetch('/api/user/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ statusMessage: status })
        });
        if (resp.ok) {
          setCurrentUser((prev: any) => ({
            ...prev,
            statusMessage: status
          }));
          showNotificationToast('💬 Status Updated', `Your bio: "${status}" is live on the scoreboard!`);
        }
      } catch (e) {
        console.error('Failed to sync status:', e);
      }
    }
  };

  // Profile Event: Update avatar picture
  const handleUpdateAvatar = async (avatarUrl: string) => {
    if (token) {
      try {
        const resp = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ avatarUrl })
        });
        if (resp.ok) {
          setCurrentUser((prev: any) => ({
            ...prev,
            avatarUrl
          }));
          showNotificationToast('📷 Avatar Perfected', 'Your new profile avatar is live across high-score networks!');
          fetchDbRecords();
        }
      } catch (e) {
        console.error('Failed to save avatar:', e);
      }
    }
  };

  // Profile Event: Log Out
  const handleLogout = () => {
    localStorage.removeItem('glowup_jwt_token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    showNotificationToast('👋 Signed Out', 'Your sandbox secure session has ended.');
  };

  // SANDBOX: Simulate random peer score log
  const handleSimulateFriendActivity = async () => {
    if (token) {
      try {
        const resp = await fetch('/api/user/simulate', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          showNotificationToast('🎯 Peer Event Simulated', 'A random connection logged their progress in Postgres.');
          fetchDbRecords();
        }
      } catch (err) {
        console.error('Peer simulation failed:', err);
      }
    }
  };

  // SANDBOX: Simulate received nudge back
  const handleTriggerRandomNudge = () => {
    const friendNames = ['James Knight', 'Alex Rivers', 'Dr. Clara Watson'];
    const selected = friendNames[Math.floor(Math.random() * friendNames.length)];
    const messages = [
      'Stop scrolling, log some deep work session! 💤',
      'I am hit 10 points already, speed up! 🚀',
      'BDNF release session. Let\'s run! 🏃‍♂️',
      'Hydrate and protect those digital boundaries!'
    ];

    const pickMsg = messages[Math.floor(Math.random() * messages.length)];
    showNotificationToast(`🔔 Taunt from ${selected}`, pickMsg);

    const welcomeActivity: ActivityItem = {
      id: Math.random().toString(),
      username: 'peer',
      displayName: selected,
      avatarUrl: `https://api.dicebear.com/7.x/open-peeps/svg?seed=${selected}`,
      taskName: 'Nudge alert!',
      points: 0,
      timestamp: 'Just now',
      type: 'nudge',
      message: `nudged you back: "${pickMsg}"`
    };
    setActivities(prev => [welcomeActivity, ...prev]);
  };

  // SANDBOX: Reset all logs and local db
  const handleHardReset = async () => {
    if (token) {
      try {
        await fetch('/api/user/reset', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setLogs([]);
        setCurrentDate(new Date().toISOString().split('T')[0]);
        if (currentUser) {
          setCurrentUser((prev: any) => ({
            ...prev,
            streak: 0,
            bestStreak: 0
          }));
        }
        showNotificationToast('🔄 Sync Reset Complete', 'All previous sandbox logs have been pruned.');
      } catch (err) {
        console.error('Reset database failed:', err);
      }
    }
  };

  // Handling initial page loaders & secure landing screen redirection
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Establishing Secure Handshake...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    if (showAuthScreen) {
      return (
        <div className="relative">
          {/* Back button overlay */}
          <button 
            onClick={() => setShowAuthScreen(false)}
            className="absolute top-6 left-6 z-50 px-3.5 py-1.5 rounded-xl border border-zinc-250 dark:border-zinc-800 text-xs font-semibold bg-white/90 dark:bg-zinc-950/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-sm cursor-pointer select-none"
          >
            ← Back to Home
          </button>
          <AuthScreen
            onAuthSuccess={(t, u) => {
              setToken(t);
              setCurrentUser(u);
              setIsAuthenticated(true);
            }}
          />
        </div>
      );
    }
    return (
      <LandingPage 
        onEnterApp={() => setShowAuthScreen(true)} 
      />
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Floating alert system portal */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 pointer-events-none max-w-sm ml-auto space-y-2">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-zinc-900/95 dark:bg-zinc-900/95 text-zinc-100 p-4 rounded-2xl shadow-xl flex items-start gap-3 border border-zinc-800/80"
            >
              <div className="flex-1">
                <span className="block text-xs font-bold leading-tight flex items-center gap-1 text-indigo-400">
                  ⭐️ {notif.title}
                </span>
                <span className="block text-[11px] text-zinc-350 mt-1 leading-relaxed">
                  {notif.body}
                </span>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Elegant minimalist header - compact & mobile optimized */}
      <header className="sticky top-0 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200/55 dark:border-zinc-800/50 z-30 px-4 py-3 sm:px-6 sm:py-4 select-none transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 rounded-full blur-[2px] opacity-85 shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-sans tracking-widest uppercase text-zinc-900 dark:text-white leading-tight">
                GlowUp 10
              </h1>
              <p className="text-[8px] sm:text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-widest font-mono">
                The 10-Point Challenge
              </p>
            </div>
          </div>

          {/* Theme Toggler */}
          <button
            id="theme-toggler-btn"
            onClick={() => { playCuteClick(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
            className="p-1.5 sm:p-2 rounded-xl border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-405 transition-colors cursor-pointer select-none animate-fade-in"
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </header>

      {/* Primary body view wrapper - scrolling happens smooth inside main panel within full-screen viewport */}
      <main className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-28 scroll-smooth select-text">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-8"
            >
              {/* Daily Circle Ring */}
              <PointCircle 
                points={currentDayLog.pointsEarned} 
                goal={10} 
                streak={currentStreak} 
              />

              {/* Action Grid */}
              <TaskGrid
                tasks={GLOWUP_TASKS}
                completedTaskIds={currentDayLog.completedTaskIds}
                writingText={currentDayLog.writingText}
                writingWordsCount={currentDayLog.writingWordsCount}
                onToggleTask={handleToggleTask}
                onChangeWriting={handleChangeWriting}
              />
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div
              key="social-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <SocialHub
                friends={friends}
                activities={activities}
                currentUserPoints={currentDayLog.pointsEarned}
                currentUserStreak={currentStreak}
                currentUser={currentUser}
                onAddFriend={handleAddFriend}
                onSendNudge={handleSendNudge}
                onSyncContacts={handleSyncContacts}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <ProfileAnalytics
                logs={logs}
                streak={currentStreak}
                bestStreak={bestStreak}
                currentUser={currentUser}
                onUpdateStatus={handleUpdateStatus}
                onUpdateAvatar={handleUpdateAvatar}
                onLogout={handleLogout}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Premium native bottom navigation bar for iOS & Android Feel (Stationary & Sticky at the bottom) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40 select-none">
        <div className="bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] p-1.5 rounded-2xl">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => { playCuteClick(); setActiveTab('dashboard'); }}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-indigo-650 dark:text-indigo-400 scale-[1.03] bg-indigo-500/10 dark:bg-indigo-500/15 font-extrabold'
                  : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <Compass className="w-5 h-5 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider font-mono">Glow</span>
            </button>
            
            <button
              onClick={() => { playCuteClick(); setActiveTab('social'); }}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === 'social'
                  ? 'text-indigo-650 dark:text-indigo-400 scale-[1.03] bg-indigo-500/10 dark:bg-indigo-500/15 font-extrabold'
                  : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <Users className="w-5 h-5 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider font-mono">Compete</span>
            </button>
            
            <button
              onClick={() => { playCuteClick(); setActiveTab('analytics'); }}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'text-indigo-650 dark:text-indigo-400 scale-[1.03] bg-indigo-500/10 dark:bg-indigo-500/15 font-extrabold'
                  : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <User className="w-5 h-5 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider font-mono">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
