/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Friend, ActivityItem, DailyLog } from './types';

export const GLOWUP_TASKS: Task[] = [
  {
    id: 'reading',
    name: 'Reading',
    category: 'Intellectual',
    points: 2,
    condition: '10 pages of any book',
    description: 'Engage with written ideas. Expands vocabulary, attention span, and active comprehension.',
    isBinary: true,
    iconName: 'BookOpen',
  },
  {
    id: 'long_form',
    name: 'Long-form Content',
    category: 'Intellectual',
    points: 1,
    condition: 'Substantive audio/video (Podcasts, Documentaries)',
    description: 'Listen to highly informative lectures, long-form journals, or deep topic investigations (no quick-clip content).',
    isBinary: true,
    iconName: 'Clapperboard',
  },
  {
    id: 'academic',
    name: 'Academic Reading',
    category: 'Intellectual',
    points: 1,
    condition: 'Read an academic paper (even Abstract & Conc.)',
    description: 'Engage with raw scientific papers to understand research methodology and direct experimental facts.',
    isBinary: true,
    iconName: 'FileText',
  },
  {
    id: 'writing',
    name: 'Essays & Journaling',
    category: 'Writing',
    points: 2,
    condition: 'Write 200+ words (Journal, Essays, Life recap)',
    description: 'Formulate structured thoughts. Complete 200+ words in our active editor below to claim this score.',
    isBinary: false,
    iconName: 'PenTool',
  },
  {
    id: 'feynman',
    name: 'Feynman Technique',
    category: 'Intellectual',
    points: 1,
    condition: 'Explain learned concepts to a person or object',
    description: 'Explain a complex concept in plain primary school terms until any logical gap is fully identified and resolved.',
    isBinary: true,
    iconName: 'Sparkles',
  },
  {
    id: 'digital_boundary',
    name: 'Digital Boundary',
    category: 'Focus',
    points: 1,
    condition: 'No phone for first & last 30 mins of the day',
    description: 'Protect your morning focus and sleep hygiene by completely avoiding screens before bed and right after waking.',
    isBinary: true,
    iconName: 'SmartphoneCheck',
  },
  {
    id: 'deep_work',
    name: 'Deep Work Session',
    category: 'Focus',
    points: 1,
    condition: '1 hour continuous distraction-free offline time',
    description: 'Block all notifications, browser tabs, and phone triggers. Work in absolute continuous calm for exactly 1 hour.',
    isBinary: true,
    iconName: 'Cpu',
  },
  {
    id: 'sleep',
    name: 'Restorative Sleep',
    category: 'Body',
    points: 2,
    condition: '8+ hours of sleep (Memory consolidation)',
    description: 'Prioritize a full sleep cycle. Indispensable for neurological restoration, memory organization, and neuroplasticity.',
    isBinary: true,
    iconName: 'Moon',
  },
  {
    id: 'physical',
    name: 'Physical Activity',
    category: 'Body',
    points: 1,
    condition: '20+ mins cardio or physical movement (BDNF release)',
    description: 'Elevate heart rate. Stimulates brain-derived neurotrophic factor, boosting mood, memory, and cognitive speed.',
    isBinary: true,
    iconName: 'Flame',
  },
];

// Initial preloaded friends showing active engagement
export const INITIAL_FRIENDS: Friend[] = [
  {
    username: 'alex_glow',
    displayName: 'Alex Rivers',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex',
    streak: 14,
    bestStreak: 21,
    isCurrentUser: false,
    todayPoints: 8,
    isHighestStreak: true,
    statusMessage: 'Deep into writing an essay today! ✍️',
    nudgeCount: 0,
  },
  {
    username: 'sarah_m',
    displayName: 'Sarah Miller',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Sarah',
    streak: 9,
    bestStreak: 9,
    isCurrentUser: false,
    todayPoints: 10,
    isHighestStreak: false,
    statusMessage: 'Hit 10/10 today! Bedtime boundary next 😴',
    nudgeCount: 0,
  },
  {
    username: 'james_k',
    displayName: 'James Knight',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=James',
    streak: 3,
    bestStreak: 5,
    isCurrentUser: false,
    todayPoints: 2,
    isHighestStreak: false,
    statusMessage: 'Struggling to stay off my phone 📱',
    nudgeCount: 0,
  },
  {
    username: 'emily_growth',
    displayName: 'Emily Chen',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Emily',
    streak: 11,
    bestStreak: 12,
    isCurrentUser: false,
    todayPoints: 6,
    isHighestStreak: false,
    statusMessage: 'Cardio session completed! BDNF is flowing 🏃‍♀️',
    nudgeCount: 0,
  },
];

export const INITIAL_ACTIVITY_FEED: ActivityItem[] = [
  {
    id: 'feed_1',
    username: 'sarah_m',
    displayName: 'Sarah Miller',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Sarah',
    taskName: 'Reading',
    points: 2,
    timestamp: '25m ago',
    type: 'log',
  },
  {
    id: 'feed_2',
    username: 'alex_glow',
    displayName: 'Alex Rivers',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex',
    taskName: 'Essays & Journaling',
    points: 2,
    timestamp: '1h ago',
    type: 'log',
  },
  {
    id: 'feed_3',
    username: 'emily_growth',
    displayName: 'Emily Chen',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Emily',
    taskName: 'Physical Activity',
    points: 1,
    timestamp: '2h ago',
    type: 'log',
  },
  {
    id: 'feed_4',
    username: 'alex_glow',
    displayName: 'Alex Rivers',
    avatarUrl: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex',
    taskName: 'Streaked!',
    points: 0,
    timestamp: '4h ago',
    type: 'streak',
    message: 'Alex locked in a 14-day streak!',
  },
];

// Helper to generate elegant mock logs for the past 30 days to make the analytics look amazing on first load!
export function generatePrepopulatedHistory(): DailyLog[] {
  const logs: DailyLog[] = [];
  const today = new Date();
  
  // Create history for 30 days
  for (let i = 30; i >= 1; i--) {
    const logDate = new Date();
    logDate.setDate(today.getDate() - i);
    const dateString = logDate.toISOString().split('T')[0];
    
    // Randomize point outcome
    // Some days they succeed (10 points), some days they get 4-8 points
    const succeed = Math.random() > 0.35; // 65% success rate to keep it realistic
    
    let completedIds: string[] = [];
    let score = 0;
    
    if (succeed) {
      // Create high scoring combination (10 points total)
      // e.g. Reading (2) + Writing (2) + Sleep (2) + Digital boundary (1) + Physical (1) + Deep Work (1) + Feynman (1) = 10 pts
      completedIds = ['reading', 'writing', 'sleep', 'digital_boundary', 'physical', 'deep_work', 'feynman'];
      score = 10;
    } else {
      // Moderate day (e.g. 5 or 6 points)
      // e.g. Reading (2) + Long-form (1) + Sleep (2) + Physical (1) = 6 pts
      const options = [
        { id: 'reading', pts: 2 },
        { id: 'sleep', pts: 2 },
        { id: 'long_form', pts: 1 },
        { id: 'physical', pts: 1 },
        { id: 'digital_boundary', pts: 1 },
        { id: 'academic', pts: 1 },
      ];
      
      // Shuffle options and pick a few
      const shuffled = [...options].sort(() => 0.5 - Math.random());
      for (const opt of shuffled) {
        if (score + opt.pts <= 9) {
          completedIds.push(opt.id);
          score += opt.pts;
        }
      }
    }
    
    logs.push({
      date: dateString,
      completedTaskIds: completedIds,
      writingWordsCount: completedIds.includes('writing') ? 220 : 0,
      writingText: completedIds.includes('writing') ? 'Pre-logged historical journaling essay that contains more than two hundred words for developmental testing purposes...' : '',
      pointsEarned: score,
    });
  }
  
  return logs;
}
