import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, SkipForward, Plus, Trash2, Check, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  DEFAULT_SETTINGS,
  KEYS,
  Session,
  Settings,
  Task,
  computeEarned,
  formatDuration,
  formatMoney,
  uid,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Phase = "focus" | "short" | "long";

function phaseLabel(p: Phase) {
  return p === "focus" ? "Focus" : p === "short" ? "Short Break" : "Long Break";
}

function HomePage() {
  const { value: settings, hydrated: sHy } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const { value: tasks, setValue: setTasks, hydrated: tHy } = useLocalStorage<Task[]>(KEYS.tasks, []);
  const { value: sessions, setValue: setSessions } = useLocalStorage<Session[]>(KEYS.sessions, []);
  const { value: activeTaskId, setValue: setActiveTaskId } = useLocalStorage<string | null>(
    KEYS.activeTaskId,
    null,
  );

  const [phase, setPhase] = useState<Phase>("focus");
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [completedFocusCount, setCompletedFocusCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef<number>(0);
  const [loggedSecInCurrentPomo, setLoggedSecInCurrentPomo] = useState(0);

  const phaseTotalSec = useMemo(() => {
    const min =
      phase === "focus" ? settings.focusMin : phase === "short" ? settings.shortBreakMin : settings.longBreakMin;
    return Math.max(1, Math.round(min * 60));
  }, [phase, settings]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;
  const activeRate =
    activeTask?.hourlyRate != null ? activeTask.hourlyRate : settings.defaultHourlyRate;

  const remainingSec = Math.max(0, phaseTotalSec - elapsedSec);
  const liveEarned = phase === "focus" ? computeEarned(elapsedSec, activeRate) : 0;

  // Timer tick
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - (startRef.current ?? now)) / 1000;
      setElapsedSec(baseRef.current + delta);
    }, 250);
    return () => {
      const now = Date.now();
      const delta = (now - (startRef.current ?? now)) / 1000;
      baseRef.current = baseRef.current + delta;
      startRef.current = null;
      window.clearInterval(id);
    };
  }, [running]);

  // Reset base when phase changes
  useEffect(() => {
    baseRef.current = 0;
    setElapsedSec(0);
    setLoggedSecInCurrentPomo(0);
  }, [phase]);

  const finishPhase = useCallback(() => {
    if (phase === "focus") {
      const totalDuration = Math.round(phaseTotalSec);
      const duration = Math.max(0, totalDuration - loggedSecInCurrentPomo);
      const rate = activeRate;
      const earned = computeEarned(duration, rate);

      if (duration > 0) {
        const session: Session = {
          id: uid(),
          taskId: activeTask?.id ?? null,
          taskTitle: activeTask?.title ?? "No task",
          startedAt: Date.now() - duration * 1000,
          endedAt: Date.now(),
          durationSec: duration,
          rate,
          earned,
        };
        setSessions((prev) => [session, ...prev]);
        if (activeTask) {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === activeTask.id
                ? {
                    ...t,
                    totalSec: t.totalSec + duration,
                    totalEarned: t.totalEarned + earned,
                    pomodoros: Number((t.pomodoros + duration / phaseTotalSec).toFixed(2)),
                  }
                : t,
            ),
          );
        }
        toast.success(
          `Pomodoro complete! ${formatDuration(duration)} • ${formatMoney(earned, settings.currency)}`,
          { description: activeTask ? `Credited to "${activeTask.title}"` : "No task selected" },
        );
      } else {
        toast.success("Pomodoro complete!");
      }

      if (settings.soundOn) beep();
      const next = completedFocusCount + 1;
      setCompletedFocusCount(next);
      setPhase(next % settings.longBreakEvery === 0 ? "long" : "short");
    } else {
      toast.info(`${phaseLabel(phase)} finished. Back to focus.`);
      if (settings.soundOn) beep();
      setPhase("focus");
    }
    baseRef.current = 0;
    setElapsedSec(0);
    setLoggedSecInCurrentPomo(0);
    setRunning(false);
  }, [
    phase,
    phaseTotalSec,
    activeRate,
    activeTask,
    settings,
    completedFocusCount,
    loggedSecInCurrentPomo,
    setSessions,
    setTasks,
  ]);

  useEffect(() => {
    if (elapsedSec >= phaseTotalSec && running) {
      finishPhase();
    }
  }, [elapsedSec, phaseTotalSec, running, finishPhase]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    baseRef.current = 0;
    setElapsedSec(0);
    setLoggedSecInCurrentPomo(0);
  };
  const skip = () => {
    setRunning(false);
    baseRef.current = 0;
    setElapsedSec(0);
    setLoggedSecInCurrentPomo(0);
    setPhase(phase === "focus" ? "short" : "focus");
  };

  const handleSwitchTask = (newTaskId: string | null) => {
    if (newTaskId === activeTaskId) return;

    if (running && phase === "focus") {
      const segmentDuration = Math.round(elapsedSec) - loggedSecInCurrentPomo;
      if (segmentDuration > 0) {
        const rate = activeRate;
        const earned = computeEarned(segmentDuration, rate);
        const session: Session = {
          id: uid(),
          taskId: activeTask?.id ?? null,
          taskTitle: activeTask?.title ?? "No task",
          startedAt: Date.now() - segmentDuration * 1000,
          endedAt: Date.now(),
          durationSec: segmentDuration,
          rate,
          earned,
        };

        setSessions((prev) => [session, ...prev]);
        if (activeTask) {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === activeTask.id
                ? {
                    ...t,
                    totalSec: t.totalSec + segmentDuration,
                    totalEarned: t.totalEarned + earned,
                    pomodoros: Number((t.pomodoros + segmentDuration / phaseTotalSec).toFixed(2)),
                  }
                : t,
            ),
          );
        }
        setLoggedSecInCurrentPomo((prev) => prev + segmentDuration);
        toast.info(
          `Logged ${formatDuration(segmentDuration)} to "${activeTask?.title ?? "No task"}"`,
        );
      }
    }
    setActiveTaskId(newTaskId);
  };

  // Task list handlers
  const [newTitle, setNewTitle] = useState("");
  const [newRate, setNewRate] = useState<string>("");

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    const rate = newRate.trim() === "" ? null : Number(newRate);
    const task: Task = {
      id: uid(),
      title,
      hourlyRate: rate != null && !Number.isNaN(rate) ? rate : null,
      done: false,
      createdAt: Date.now(),
      totalSec: 0,
      totalEarned: 0,
      pomodoros: 0,
    };
    setTasks([task, ...tasks]);
    if (!activeTaskId) setActiveTaskId(task.id);
    setNewTitle("");
    setNewRate("");
  };

  const toggleDone = (id: string) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    if (!taskToToggle) return;

    const isMarkingDone = !taskToToggle.done;

    if (id === activeTaskId && isMarkingDone && running && phase === "focus") {
      const segmentDuration = Math.round(elapsedSec) - loggedSecInCurrentPomo;
      if (segmentDuration > 0) {
        const rate = activeRate;
        const earned = computeEarned(segmentDuration, rate);
        const session: Session = {
          id: uid(),
          taskId: taskToToggle.id,
          taskTitle: taskToToggle.title,
          startedAt: Date.now() - segmentDuration * 1000,
          endedAt: Date.now(),
          durationSec: segmentDuration,
          rate,
          earned,
        };

        setSessions((prev) => [session, ...prev]);

        const nextTask = tasks.find((t) => t.id !== id && !t.done);

        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: true,
                  totalSec: t.totalSec + segmentDuration,
                  totalEarned: t.totalEarned + earned,
                  pomodoros: Number((t.pomodoros + segmentDuration / phaseTotalSec).toFixed(2)),
                }
              : t,
          ),
        );
        
        setLoggedSecInCurrentPomo((prev) => prev + segmentDuration);
        setActiveTaskId(nextTask ? nextTask.id : null);
        toast.success(`Completed "${taskToToggle.title}"! Logged ${formatDuration(segmentDuration)}.`);
      } else {
        const nextTask = tasks.find((t) => t.id !== id && !t.done);
        setTasks((prevTasks) => prevTasks.map((t) => (t.id === id ? { ...t, done: true } : t)));
        setActiveTaskId(nextTask ? nextTask.id : null);
      }
    } else {
      setTasks((prevTasks) => prevTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    }
  };

  const removeTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      handleSwitchTask(null);
    }
  };

  const updateRate = (id: string, val: string) => {
    const n = val.trim() === "" ? null : Number(val);
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, hourlyRate: n != null && !Number.isNaN(n) ? n : null } : t,
      ),
    );
  };

  const progress = (elapsedSec / phaseTotalSec) * 100;
  const mm = Math.floor(remainingSec / 60).toString().padStart(2, "0");
  const ss = Math.floor(remainingSec % 60).toString().padStart(2, "0");

  if (!sHy || !tHy) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-muted-foreground">
              {phaseLabel(phase)}
            </CardTitle>
            <div className="flex gap-2">
              {(["focus", "short", "long"] as Phase[]).map((p) => (
                <Button
                  key={p}
                  variant={phase === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRunning(false);
                    setPhase(p);
                  }}
                >
                  {phaseLabel(p)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="font-mono text-7xl md:text-8xl font-bold tabular-nums tracking-tight">
              {mm}:{ss}
            </div>
            <div className="mt-3">
              <Progress value={progress} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Elapsed</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {formatDuration(Math.floor(elapsedSec))}
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Earning ({formatMoney(activeRate, settings.currency)}/hr)
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {formatMoney(liveEarned, settings.currency)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {!running ? (
              <Button size="lg" onClick={start}>
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={pause}>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button size="lg" variant="ghost" onClick={skip}>
              <SkipForward className="mr-2 h-4 w-4" /> Skip
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {activeTask ? (
              <>Working on: <span className="text-foreground font-medium">{activeTask.title}</span></>
            ) : (
              <>Select a task below to credit your pomodoros.</>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>To-do</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="What are you working on?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1"
            />
            <div className="relative sm:w-40">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Rate (default ${settings.defaultHourlyRate})`}
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="pl-7"
              />
            </div>
            <Button onClick={addTask}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add one to start tracking.
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => {
                const isActive = t.id === activeTaskId;
                const rate = t.hourlyRate ?? settings.defaultHourlyRate;
                return (
                  <li
                    key={t.id}
                    className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                      isActive ? "border-primary bg-accent/40" : "border-border"
                    }`}
                  >
                    <Button
                      variant={t.done ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => toggleDone(t.id)}
                      aria-label="Toggle done"
                    >
                      {t.done && <Check className="h-4 w-4" />}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleSwitchTask(t.id)}
                      className={`flex-1 text-left truncate ${t.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      <div className="truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.pomodoros} pomodoros • {formatDuration(t.totalSec)} •{" "}
                        {formatMoney(t.totalEarned, settings.currency)}
                      </div>
                    </button>
                    {isActive && <Badge variant="secondary">Active</Badge>}
                    <div className="relative w-28">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={t.hourlyRate ?? ""}
                        placeholder={String(settings.defaultHourlyRate)}
                        onChange={(e) => updateRate(t.id, e.target.value)}
                        className="pl-6 h-8 text-sm"
                        title={`Effective rate: ${formatMoney(rate, settings.currency)}/hr`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeTask(t.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function beep() {
  try {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.65);
  } catch {
    /* ignore */
  }
}