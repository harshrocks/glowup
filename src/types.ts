/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskCategory = 'Intellectual' | 'Writing' | 'Focus' | 'Body';

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  points: number;
  condition: string;
  description: string;
  isBinary: boolean;
  iconName: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  writingWordsCount: number;
  writingText: string;
  pointsEarned: number;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  streak: number;
  bestStreak: number;
  isCurrentUser: boolean;
}

export interface Friend extends UserProfile {
  todayPoints: number;
  isHighestStreak: boolean;
  statusMessage?: string;
  nudgeCount: number;
}

export interface ActivityItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  taskName: string;
  points: number;
  timestamp: string; // e.g., "10m ago", "2h ago"
  type: 'log' | 'nudge' | 'streak';
  message?: string;
}

export interface NudgeMessage {
  id: string;
  sender: string;
  receiver: string;
  type: 'taunt' | 'wake_up' | 'cheer' | 'fire';
  text: string;
  timestamp: string;
}
