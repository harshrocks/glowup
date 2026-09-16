# ✨ GlowUp 10 - Cute Flutter App & Web Platform

A social productivity and gamified habit-tracking app that gamifies hitting exactly 10 points daily through high-leverage intellectual, writing, focus, and physical challenges.

---

## 📱 Flutter Mobile & Web App (`glow_up_app/`)

### ✨ Features
- 🌟 **Radial 10-Point HUD Dial**: Custom circular visualizer with 10 milestone radial ticks, live percentage pill, crown indicator on 10 pts, and day streak banner.
- ✍️ **200-Word Reflective Essay Editor**: Live circular word counter gauge with celebratory milestone unlocking (+2 pts).
- 🏆 **Live Ranked Leaderboard**: Real-time standings with podium medals, crowned streak winner, and quick nudges (*"Wake up 💤"*, *"Cheer 🙌"*, *"Flame Taunt 🔥"*).
- 🎨 **Doodle Avatar Personalizer**: 16 preset open-peeps avatars + custom seed doodle generator with instant preview.
- 📊 **Category Donut Chart & 28-Day Heatmap**: Visual breakdown across Intellectual, Writing, Focus, and Body habits with consistency metrics.
- 🔒 **Anti-Cheat Focus Protection**: 8-second debounce protection between task logs.
- 🌙 **Dark & Light Cute Modes**: Seamless cosmic kawaii dark mode and pastel pearl light mode.

### 🚀 Running the Flutter App

```bash
cd glow_up_app
flutter pub get

# Run on Chrome (Web)
flutter run -d chrome

# Run on Windows Desktop
flutter run -d windows

# Run on connected Mobile device / Emulator
flutter run
```

---

## 🛠️ Backend API Server (Optional Node.js/PostgreSQL backend)

```bash
# In the root workspace directory
npm install
npm run dev
```
