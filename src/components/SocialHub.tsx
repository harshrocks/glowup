/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Plus, 
  Crown, 
  Bell, 
  Activity, 
  QrCode, 
  Smartphone,
  Sparkles, 
  X, 
  Check, 
  Send, 
  Award,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Friend, ActivityItem } from '../types';

interface SocialHubProps {
  friends: Friend[];
  activities: ActivityItem[];
  currentUserPoints: number;
  currentUserStreak: number;
  currentUser?: { username: string; displayName: string; avatarUrl: string; statusMessage?: string } | null;
  onAddFriend: (username: string, displayName: string) => void;
  onSendNudge: (friendUsername: string, nudgeType: string, message: string) => void;
  onSyncContacts: () => void;
}

export default function SocialHub({
  friends,
  activities,
  currentUserPoints,
  currentUserStreak,
  currentUser,
  onAddFriend,
  onSendNudge,
  onSyncContacts
}: SocialHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedFriendNudge, setSelectedFriendNudge] = useState<Friend | null>(null);
  const [customTauntText, setCustomTauntText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Formulate absolute rank listing including current user
  const leaderboardList = [
    {
      username: currentUser?.username || 'you',
      displayName: currentUser?.displayName || 'You (GlowUp Master)',
      avatarUrl: currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/open-peeps/svg?seed=You',
      streak: currentUserStreak,
      todayPoints: currentUserPoints,
      isCurrentUser: true,
      isHighestStreak: false,
      statusMessage: currentUser?.statusMessage || (currentUserPoints >= 10 ? 'Logged in and glowing! ✨' : 'Working my way to 10 points...')
    },
    ...friends.map(f => ({
      username: f.username,
      displayName: f.displayName,
      avatarUrl: f.avatarUrl,
      streak: f.streak,
      todayPoints: f.todayPoints,
      isCurrentUser: false,
      isHighestStreak: f.isHighestStreak,
      statusMessage: f.statusMessage
    }))
  ];

  // Sort by points desc, then by streak desc
  const sortedLeaderboard = [...leaderboardList].sort((a, b) => {
    if (b.todayPoints !== a.todayPoints) {
      return b.todayPoints - a.todayPoints;
    }
    return b.streak - a.streak;
  });

  // Calculate highest streak overall
  const highestStreakVal = Math.max(...sortedLeaderboard.map(item => item.streak));
  
  // Set the first item of highest streak as crowned
  const crownedUsername = sortedLeaderboard.find(item => item.streak === highestStreakVal)?.username;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if friend already exists
    const sanitizedQuery = searchQuery.trim().toLowerCase();
    const alreadyFriend = friends.some(f => f.username === sanitizedQuery || f.displayName.toLowerCase() === sanitizedQuery);

    if (alreadyFriend) {
      triggerFeedback(`"${searchQuery}" is already in your glow feed!`);
      setSearchQuery('');
      return;
    }

    // Capitalize and insert
    const formattedName = searchQuery.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    onAddFriend(sanitizedQuery, formattedName);
    triggerFeedback(`Added "${formattedName}" successfully!`);
    setSearchQuery('');
  };

  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleNudgeOption = (type: string, presetText: string) => {
    if (!selectedFriendNudge) return;
    
    // Dispatch
    onSendNudge(selectedFriendNudge.username, type, presetText);
    triggerFeedback(`Sent "${presetText}" to ${selectedFriendNudge.displayName}!`);
    setSelectedFriendNudge(null);
  };

  const handleCustomNudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendNudge || !customTauntText.trim()) return;

    onSendNudge(selectedFriendNudge.username, 'taunt', customTauntText.trim());
    triggerFeedback(`Taunt sent: "${customTauntText.trim()}" to ${selectedFriendNudge.displayName}`);
    setCustomTauntText('');
    setSelectedFriendNudge(null);
  };  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-zinc-50/20 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-250 dark:border-zinc-850 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Add friends by username..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-100/60 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 text-zinc-805 dark:text-zinc-100 font-sans"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-450" />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            id="sync-contacts-btn"
            onClick={() => setShowSyncModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Contacts
          </button>
          <button
            id="qr-scanner-btn"
            onClick={() => setShowQRModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            Show QR Code
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 text-xs rounded-xl font-medium text-center"
        >
          {feedbackMsg}
        </motion.div>
      )}

      {/* Grid: Leaderboard & Recent Social Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div id="leaderboard-panel" className="lg:col-span-7 bg-zinc-50/20 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-250 dark:border-zinc-850 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-1">
                Leaderboard
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Compare today's point totals. Resetting at midnight.
              </p>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-2.5 py-0.5 rounded bg-zinc-100/80 dark:bg-zinc-900 w-auto select-none border border-zinc-200 dark:border-zinc-800">
              Ranked Live
            </span>
          </div>

          <div className="space-y-3">
            {sortedLeaderboard.map((user, idx) => {
              const isCrowned = user.username === crownedUsername && user.streak > 0;
              const hasGlowed = user.todayPoints >= 10;
              const isMe = user.isCurrentUser;

              return (
                <div
                  key={user.username}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between relative ${
                    isMe 
                      ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/30 dark:border-indigo-500/20 shadow-xs'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Position circle */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold leading-none ${idx === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : idx === 1 ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30' : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}>
                      {idx + 1}
                    </div>

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar with crown overlay */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className={`w-9 h-9 rounded-full object-cover border-2 ${hasGlowed ? 'border-amber-400' : 'border-zinc-200 dark:border-zinc-850'}`}
                        />
                        {isCrowned && (
                          <div className="absolute -top-2 -right-0.5 bg-amber-400 text-amber-950 p-0.5 rounded-full">
                            <Crown className="w-2.5 h-2.5 fill-amber-950" />
                          </div>
                        )}
                      </div>

                      {/* Identification and Status */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-sm font-semibold truncate block ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                            {isMe ? 'You' : user.displayName}
                          </span>
                        </div>
                        
                        {user.statusMessage && (
                          <p className="text-[11px] text-zinc-450 dark:text-zinc-500 truncate mt-0.5">
                            "{user.statusMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Points and Quick Nudge action */}
                  <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-bold font-mono ${hasGlowed ? 'text-amber-500' : 'text-zinc-800 dark:text-zinc-250'}`}>
                        {user.todayPoints < 10 ? `0${user.todayPoints}` : user.todayPoints} pts
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
                        🔥 {user.streak < 10 ? `0${user.streak}` : user.streak}
                      </span>
                    </div>

                    {/* Nudge button if not current user */}
                    {!isMe ? (
                      <button
                        id={`nudge-friend-${user.username}`}
                        onClick={() => {
                          const originalFriend = friends.find(f => f.username === user.username);
                          if (originalFriend) setSelectedFriendNudge(originalFriend);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium uppercase tracking-widest transition-colors select-none text-zinc-805 dark:text-zinc-300"
                      >
                        Nudge
                      </button>
                    ) : (
                      // Dummy placeholder to align beautifully
                      <div className="w-[64px]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div id="activity-feed" className="lg:col-span-5 bg-zinc-50/20 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-250 dark:border-zinc-850 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold mb-2">
              Weekly Habit Flow
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Real-time feed of intellectual completions.
            </p>
          </div>

          <div className="space-y-4 pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">
                No recent activity. Push hard and encourage others!
              </div>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="flex gap-3 items-start select-none">
                  <img
                    src={item.avatarUrl}
                    alt={item.displayName}
                    className="w-7 h-7 rounded-full object-cover mt-0.5 border border-zinc-200 dark:border-zinc-800"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans text-zinc-600 dark:text-zinc-300 leading-tight">
                      <span className="font-bold text-zinc-800 dark:text-zinc-100">
                        {item.username === 'you' ? 'You' : item.displayName}
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
                    
                    <span className="text-[9px] font-mono text-zinc-500">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Social Motive banner */}
          <div className="bg-zinc-100/50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 text-center">
            <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">
              Social Rules
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              "We are what we repeatedly do. Excellence, then, is not an act, but a habit." Choose supportive peers to compound status.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: QR Code display */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl max-w-sm w-full text-center relative shadow-xl z-50 flex flex-col items-center"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>

              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Your Glow QR Pass
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Let your peers scan this code to synch lists and start tracking streaks collaboratively.
              </p>

              {/* Visual SVG QR design illustration */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 my-5 shadow-inner">
                <svg className="w-36 h-36 text-slate-800" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M5 5h30v30H5V5zm3 3v24h24V8H8zm6 6h12v12H14V14zm51-9h30v30H65V5zm3 3v24h24V8H68zm6 6h12v12H74V14zM5 65h30v30H5V65zm3 3v24h24V68H8zm6 6h12v12H14V74zm73-4H65v3h12v3h4v-3h6v4h-6v9h3v-3h7h3v-10zm-15 15h4v6h-4v-6zm15 3h4v4h-4v-4zm-15-18h4v4h-4v-4zm3 27h6v3h-6v-3zm12-9h3v3h-3v-3zm3 3h3v3h-3v-3zm-15 0h3v3h-3v-3zm-3 3h3v3h-3v-3zm6-6h3v3h-3v-3zm6 0h3v3h-3v-3zm3 0h3v4h-3v-4z" />
                </svg>
              </div>

              <div className="font-mono text-center px-4 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                username: your_account_pass
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Sync Contacts Mock listing */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl max-w-md w-full relative shadow-xl z-50 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                    Synchronizing Contacts
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    These people are in your phone contacts and tracking points!
                  </p>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {[
                  { name: 'Dr. Clara Watson', user: 'clara_theory', avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Clara', score: 9 },
                  { name: 'Marcus Aurelius Junior', user: 'philosopher_kid', avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Marcus', score: 4 },
                  { name: 'Gavin Sterling', user: 'gavin_deep', avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Gavin', score: 1 }
                ].map(item => {
                  const alreadyFriend = friends.some(f => f.username === item.user);
                  return (
                    <div key={item.user} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40">
                      <div className="flex items-center gap-3">
                        <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                          <span className="block text-[10px] font-mono text-slate-400">@{item.user} • Today: {item.score} pts</span>
                        </div>
                      </div>

                      {alreadyFriend ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onAddFriend(item.user, item.name);
                            triggerFeedback(`Added ${item.name}!`);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-right">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONSOLE: Friends Nudging Option list */}
      <AnimatePresence>
        {selectedFriendNudge && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl max-w-sm w-full relative shadow-xl z-50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Bell className="w-4.5 h-4.5 text-indigo-500" />
                    Interact with {selectedFriendNudge.displayName}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Friendly nudges and competitive taunts! Current score: {selectedFriendNudge.todayPoints} pts.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFriendNudge(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-2">
                {selectedFriendNudge.todayPoints < 5 ? (
                  <button
                    onClick={() => handleNudgeOption('wake_up', 'Wake Up! 💤 Let\'s get off the phone!')}
                    className="w-full text-left p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 group flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">💤 "Wake Up" Nudge</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Perfect for friends slacking below 5 points.</span>
                    </div>
                    <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleNudgeOption('cheer', 'Elite focus! 🙌 Keep pushing!')}
                    className="w-full text-left p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 group flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">🙌 Send Cheer Nudge</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Celebrate high performance!</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                <button
                  onClick={() => handleNudgeOption('fire', 'Catch me if you can! 🔥 Let\'s race!')}
                  className="w-full text-left p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 group flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="block text-xs font-bold text-rose-600 dark:text-rose-400">🔥 Send Flame Taunt</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Ignite key competitive friction!</span>
                  </div>
                  <Zap className="w-4 h-4 text-rose-550 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Custom text field taunt */}
              <form onSubmit={handleCustomNudgeSubmit} className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/40">
                <label className="block text-[11px] font-mono text-slate-400">CUSTOM MESSAGE / POISON THOUGHT</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. Sleep is for the weak, get up!"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
                    value={customTauntText}
                    onChange={(e) => setCustomTauntText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
