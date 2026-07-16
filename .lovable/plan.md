## Pomodoro + To-Do with Earnings

A single-user web app (no login) that combines a configurable Pomodoro timer with a to-do list. Each completed focus session logs time and money earned based on the task's hourly rate. Data persists in the browser via localStorage.

### Pages / routes
- `/` — Main workspace: timer on top, active task selector, to-do list below.
- `/stats` — History dashboard: totals for today, this week, all-time; per-task breakdown (time + money).
- `/settings` — Pomodoro durations, default hourly rate, currency.

Shared header with nav links across all routes.

### Features

**To-do list**
- Add / edit / complete / delete tasks.
- Each task: title, optional hourly rate (falls back to default), running totals (minutes focused, money earned, pomodoros completed).
- Select one task as "active" — completed pomodoros credit that task.

**Pomodoro timer**
- Configurable focus / short break / long break durations, and long-break interval (default 25 / 5 / 15 / every 4).
- Start / pause / reset. Auto-advances to break, then back to focus.
- Live earnings readout while focusing: elapsed minutes × (task rate ÷ 60).
- On focus completion: log a session, show a summary ("You focused 25 min and earned $10.42"), update task totals.
- Browser notification + sound on session end.

**Settings**
- Default hourly rate, currency symbol, timer durations, sound on/off.

**Stats page**
- Cards: today, this 7 days, all-time (total focus time + total earned).
- Table/list: per-task totals (pomodoros, time, money), sortable.
- Recent sessions list.
- Export/clear data buttons.

### Technical details
- TanStack Start routes: `src/routes/index.tsx` (replaces placeholder), `src/routes/stats.tsx`, `src/routes/settings.tsx`. Shared header lives in `__root.tsx` around `<Outlet />`.
- State: a `useLocalStorage` hook + a small store module (`src/lib/store.ts`) exposing tasks, sessions, settings, and mutation helpers. All data is JSON in `localStorage` keys (`pomo.tasks`, `pomo.sessions`, `pomo.settings`).
- Timer: `useEffect` + `setInterval` with `Date.now()` deltas so pause/resume and tab-switch drift stay accurate. Session record: `{ id, taskId, startedAt, endedAt, durationSec, rate, earned }`.
- Earnings formula: `earned = (durationSec / 3600) * hourlyRate`.
- UI: shadcn/ui primitives already in the template (Button, Input, Card, Dialog, Table, Tabs, Progress) styled through existing design tokens in `src/styles.css`; no color hardcoding.
- Update `__root.tsx` head metadata to app-specific title/description ("Focus & Earn — Pomodoro Timer with Earnings Tracking"); each route sets its own `head()`.
- No backend, no Lovable Cloud — pure client-side.

### Out of scope
- Sign-in / multi-device sync (can be added later by enabling Lovable Cloud).
- Team features, recurring tasks, subtasks, tags.
