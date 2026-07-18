export type Task = {
  id: string;
  title: string;
  hourlyRate: number | null; // null = use default
  done: boolean;
  createdAt: number;
  totalSec: number;
  totalEarned: number;
  pomodoros: number;
};

export type Session = {
  id: string;
  taskId: string | null;
  taskTitle: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  rate: number;
  earned: number;
};

export type Settings = {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakEvery: number;
  defaultHourlyRate: number;
  currency: string;
  soundOn: boolean;
  theme: "dark" | "light";
  lang: "en" | "ar";
  youtubeNoiseOn: boolean;
  youtubeVolume: number; // 0 to 100
  youtubeOnlyWhenRunning: boolean;
};

const getSystemTheme = (): "dark" | "light" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark"; // Default fallback
};

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  defaultHourlyRate: 50,
  currency: "$",
  soundOn: true,
  theme: getSystemTheme(),
  lang: "en",
  youtubeNoiseOn: false,
  youtubeVolume: 50,
  youtubeOnlyWhenRunning: true,
};

export type Feedback = {
  id: string;
  type: "bug" | "suggestion";
  description: string;
  createdAt: number;
};

export const KEYS = {
  tasks: "pomo.tasks",
  sessions: "pomo.sessions",
  settings: "pomo.settings",
  activeTaskId: "pomo.activeTaskId",
  feedback: "pomo.feedback",
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDuration(sec: number, lang: "en" | "ar" = "en") {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (lang === "ar") {
    if (h > 0) return `${h} س ${m} د`;
    if (m > 0) return `${m} د ${s} ث`;
    return `${s} ث`;
  }
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMoney(amount: number, currency: string, lang: "en" | "ar" = "en") {
  if (lang === "ar") {
    return `${amount.toFixed(2)} ${currency}`;
  }
  return `${currency}${amount.toFixed(2)}`;
}

export function computeEarned(durationSec: number, hourlyRate: number) {
  return (durationSec / 3600) * hourlyRate;
}
