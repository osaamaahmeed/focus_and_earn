import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Trash2,
  Check,
  DollarSign,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useTranslation, TranslationKey } from "@/lib/translations";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Phase = "focus" | "short" | "long";

function phaseLabel(p: Phase, t: (k: TranslationKey) => string) {
  return p === "focus" ? t("focus") : p === "short" ? t("shortBreak") : t("longBreak");
}

const FOCUS_NOISE_VIDEO_ID = "yLOM8R6lbzg";

const FloatingTimerView = ({
  phase,
  running,
  elapsedSec,
  phaseTotalSec,
  start,
  pause,
  reset,
  skip,
  t,
  lang,
}: {
  phase: Phase;
  running: boolean;
  elapsedSec: number;
  phaseTotalSec: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  t: (k: TranslationKey) => string;
  lang: string;
}) => {
  const percentage = (elapsedSec / phaseTotalSec) * 100;
  const remainingSec = Math.max(0, phaseTotalSec - elapsedSec);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center space-y-3 font-sans">
      {/* Title / Phase badge */}
      <Badge variant={phase === "focus" ? "default" : "secondary"} className="text-xs px-2 py-0.5">
        {phase === "focus" ? t("focus") : phase === "short" ? t("shortBreak") : t("longBreak")}
      </Badge>

      {/* Large countdown */}
      <div className="text-3xl sm:text-4xl font-bold font-mono tracking-wider text-foreground tabular-nums select-all">
        {formatDuration(remainingSec)}
      </div>

      {/* Minimal progress line */}
      <div className="w-full max-w-[200px] h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            phase === "focus" ? "bg-primary" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={running ? pause : start}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          onClick={skip}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

function HomePage() {
  const { t } = useTranslation();
  const {
    value: settings,
    setValue: setSettings,
    hydrated: sHy,
  } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const {
    value: tasks,
    setValue: setTasks,
    hydrated: tHy,
  } = useLocalStorage<Task[]>(KEYS.tasks, []);
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
  const [pipWindow, setPipWindow] = useState<any>(null);
  const [showChooseTaskPrompt, setShowChooseTaskPrompt] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogRate, setDialogRate] = useState("");

  const copyStylesToPip = (pipDoc: Document) => {
    // Copy stylesheets
    [...document.querySelectorAll("style, link[rel='stylesheet']")].forEach((el) => {
      pipDoc.head.appendChild(el.cloneNode(true));
    });

    // Set matching background color and text direction/font for tailwind
    pipDoc.documentElement.className = document.documentElement.className;
    pipDoc.body.className =
      "bg-background text-foreground flex flex-col items-center justify-center h-screen overflow-hidden select-none p-4";
    pipDoc.body.dir = settings.lang === "ar" ? "rtl" : "ltr";
  };

  const togglePip = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    if (!("documentPictureInPicture" in window)) {
      toast.error(t("pipNotSupported"));
      return;
    }

    try {
      // @ts-ignore
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 280,
        height: 180,
      });

      copyStylesToPip(pip.document);

      // Listen for when the user closes the window manually
      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err) {
      console.error("Failed to open Picture-in-Picture window:", err);
      toast.error("Failed to open floating window.");
    }
  };

  // Close pip window when this component unmounts
  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  // Unlock audio on any global click or touch
  useEffect(() => {
    const handleGlobalClick = () => {
      unlockAudio();
    };
    window.addEventListener("click", handleGlobalClick, { capture: true });
    window.addEventListener("touchstart", handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
      window.removeEventListener("touchstart", handleGlobalClick, { capture: true });
    };
  }, []);

  const phaseTotalSec = useMemo(() => {
    const min =
      phase === "focus"
        ? settings.focusMin
        : phase === "short"
          ? settings.shortBreakMin
          : settings.longBreakMin;
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
      const duration = Math.max(0, Math.round(elapsedSec) - loggedSecInCurrentPomo);
      const rate = activeRate;
      const earned = computeEarned(duration, rate);

      if (duration > 0) {
        const session: Session = {
          id: uid(),
          taskId: activeTask?.id ?? null,
          taskTitle: activeTask?.title ?? t("noTask"),
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
          `${t("toastPomodoroComplete")} ${formatDuration(duration, settings.lang)} • ${formatMoney(earned, settings.currency, settings.lang)}`,
          {
            description: activeTask
              ? t("toastCreditedTo", { title: activeTask.title })
              : t("toastNoTaskSelected"),
          },
        );
      } else {
        toast.success(t("toastPomodoroComplete"));
      }

      if (settings.soundOn) beep();
      const next = completedFocusCount + 1;
      setCompletedFocusCount(next);
      setPhase(next % settings.longBreakEvery === 0 ? "long" : "short");
    } else {
      toast.info(
        `${phaseLabel(phase, t)} ${
          settings.lang === "ar" ? "انتهت. العودة للتركيز." : "finished. Back to focus."
        }`,
      );
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
    t,
    elapsedSec,
  ]);

  useEffect(() => {
    if (elapsedSec >= phaseTotalSec && running) {
      finishPhase();
    }
  }, [elapsedSec, phaseTotalSec, running, finishPhase]);

  // Control global white noise player
  useEffect(() => {
    if (!sHy) return;
    const shouldPlay = settings.youtubeNoiseOn && (!settings.youtubeOnlyWhenRunning || running);
    const command = shouldPlay ? "playVideo" : "pauseVideo";
    window.dispatchEvent(
      new CustomEvent("control-white-noise", {
        detail: { command, volume: settings.youtubeVolume },
      }),
    );
  }, [
    running,
    settings.youtubeNoiseOn,
    settings.youtubeOnlyWhenRunning,
    settings.youtubeVolume,
    sHy,
  ]);

  const start = () => {
    if (!activeTaskId) {
      setShowChooseTaskPrompt(true);
      toast.error(t("pleaseSelectTaskFirst"));
      return;
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);

  const handleFinishActiveTask = () => {
    if (!activeTask) return;

    setRunning(false);

    const segmentDuration = Math.round(elapsedSec) - loggedSecInCurrentPomo;
    const rate = activeRate;
    const earned = computeEarned(segmentDuration, rate);

    if (segmentDuration > 0) {
      const session: Session = {
        id: uid(),
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        startedAt: Date.now() - segmentDuration * 1000,
        endedAt: Date.now(),
        durationSec: segmentDuration,
        rate,
        earned,
      };

      setSessions((prev) => [session, ...prev]);

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === activeTask.id
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

      toast.success(
        t("toastCompletedTask", {
          title: activeTask.title,
          duration: formatDuration(segmentDuration, settings.lang),
        }),
      );
    } else {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === activeTask.id ? { ...t, done: true } : t)),
      );
      toast.success(
        settings.lang === "ar"
          ? `اكتملت المهمة "${activeTask.title}"`
          : `Completed task "${activeTask.title}"`,
      );
    }

    setActiveTaskId(null);
    setShowChooseTaskPrompt(true);
  };

  const handleAddAndSelect = () => {
    const title = dialogTitle.trim();
    if (!title) return;
    const rate = dialogRate.trim() === "" ? null : Number(dialogRate);
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
    setTasks((prevTasks) => [task, ...prevTasks]);
    setActiveTaskId(task.id);
    setDialogTitle("");
    setDialogRate("");
    setShowChooseTaskPrompt(false);
    setRunning(true);
    toast.success(
      settings.lang === "ar"
        ? `تم إنشاء المهمة "${title}" وتنشيطها`
        : `Created and activated task "${title}"`,
    );
  };
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
  const handleConfirmCancel = () => {
    reset();
    setShowCancelConfirm(false);
  };
  const handleCancelClick = () => {
    if (elapsedSec > 0) {
      setShowCancelConfirm(true);
    } else {
      reset();
    }
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
          taskTitle: activeTask?.title ?? t("noTask"),
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
          t("toastLoggedDuration", {
            duration: formatDuration(segmentDuration, settings.lang),
            title: activeTask?.title ?? t("noTask"),
          }),
        );
      }
    }
    setActiveTaskId(newTaskId);
    if (newTaskId) {
      setRunning(true);
    }
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
    setTasks((prevTasks) => [task, ...prevTasks]);
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
        toast.success(
          t("toastCompletedTask", {
            title: taskToToggle.title,
            duration: formatDuration(segmentDuration, settings.lang),
          }),
        );
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
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === id ? { ...t, hourlyRate: n != null && !Number.isNaN(n) ? n : null } : t,
      ),
    );
  };

  const progress = (elapsedSec / phaseTotalSec) * 100;
  const mm = Math.floor(remainingSec / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(remainingSec % 60)
    .toString()
    .padStart(2, "0");

  if (!sHy || !tHy) {
    return <div className="text-muted-foreground text-sm">{t("loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-muted-foreground">
              {phaseLabel(phase, t)}
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
                  {phaseLabel(p, t)}
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
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("elapsed")}
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {formatDuration(Math.floor(elapsedSec), settings.lang)}
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("earningRate", {
                  rate: formatMoney(activeRate, settings.currency, settings.lang),
                })}
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {formatMoney(liveEarned, settings.currency, settings.lang)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {!running ? (
              <Button size="lg" onClick={start}>
                <Play className="mx-2 h-4 w-4" /> {elapsedSec > 0 ? t("resume") : t("start")}
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={pause}>
                <Pause className="mx-2 h-4 w-4" /> {t("pause")}
              </Button>
            )}
            {activeTask && running && (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                onClick={handleFinishActiveTask}
              >
                <Check className="mx-2 h-4 w-4" /> {t("finishTask")}
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={togglePip}>
              <ExternalLink className="mx-2 h-4 w-4" />{" "}
              {pipWindow ? t("closeFloatingTimer") : t("openFloatingTimer")}
            </Button>
            {(running || elapsedSec > 0) && (
              <Button
                size="lg"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCancelClick}
              >
                <X className="mx-2 h-4 w-4" /> {t("cancel")}
              </Button>
            )}
          </div>

          {pipWindow &&
            createPortal(
              <FloatingTimerView
                phase={phase}
                running={running}
                elapsedSec={elapsedSec}
                phaseTotalSec={phaseTotalSec}
                start={start}
                pause={pause}
                reset={reset}
                skip={skip}
                t={t}
                lang={settings.lang}
              />,
              pipWindow.document.body,
            )}

          <div className="border-t border-border pt-4 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {t("youtubeNoise")}:
              </span>
              <Switch
                checked={settings.youtubeNoiseOn}
                onCheckedChange={(val) => setSettings((prev) => ({ ...prev, youtubeNoiseOn: val }))}
              />
            </div>

            {settings.youtubeNoiseOn && (
              <div className="flex items-center gap-3 w-full sm:w-60">
                {settings.youtubeVolume === 0 ? (
                  <VolumeX className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                ) : (
                  <Volume2 className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[settings.youtubeVolume]}
                    onValueChange={(val) =>
                      setSettings((prev) => ({ ...prev, youtubeVolume: val[0] }))
                    }
                    className="w-full"
                  />
                  <span className="text-xs font-mono text-muted-foreground w-8 text-end tabular-nums">
                    {settings.youtubeVolume}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {activeTask ? t("workingOn", { title: activeTask.title }) : t("selectTaskPrompt")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("todo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={t("taskPlaceholder")}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1 text-start"
            />
            <div className="relative sm:w-52">
              <DollarSign
                className={`absolute ${
                  settings.lang === "ar" ? "right-2" : "left-2"
                } top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={t("rateDefault", { rate: settings.defaultHourlyRate })}
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className={`${settings.lang === "ar" ? "pr-7" : "pl-7"} no-spinner text-start`}
              />
            </div>
            <Button onClick={addTask}>
              <Plus className="mx-2 h-4 w-4" /> {t("add")}
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("noTasks")}</div>
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
                      className={`flex-1 text-start truncate ${
                        t.done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      <div className="truncate text-start">{t.title}</div>
                      <div className="text-xs text-muted-foreground text-start">
                        {t.pomodoros} {settings.lang === "ar" ? "جلسات" : "pomodoros"} •{" "}
                        {formatDuration(t.totalSec, settings.lang)} •{" "}
                        {formatMoney(t.totalEarned, settings.currency, settings.lang)}
                      </div>
                    </button>
                    {isActive && (
                      <Badge variant="secondary">{settings.lang === "ar" ? "نشط" : "Active"}</Badge>
                    )}
                    <div className="relative w-28">
                      <DollarSign
                        className={`absolute ${
                          settings.lang === "ar" ? "right-2" : "left-2"
                        } top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground`}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={t.hourlyRate ?? ""}
                        placeholder={String(settings.defaultHourlyRate)}
                        onChange={(e) => updateRate(t.id, e.target.value)}
                        className={`${
                          settings.lang === "ar" ? "pr-6" : "pl-6"
                        } h-8 text-sm no-spinner text-start`}
                        title={
                          settings.lang === "ar"
                            ? `السعر الفعلي: ${formatMoney(rate, settings.currency, settings.lang)}/ساعة`
                            : `Effective rate: ${formatMoney(rate, settings.currency, settings.lang)}/hr`
                        }
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

      <Dialog open={showChooseTaskPrompt} onOpenChange={setShowChooseTaskPrompt}>
        <DialogContent className="sm:max-w-[450px] w-full p-6 bg-background border border-border rounded-lg shadow-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Check className="h-5 w-5 text-green-600" />
              <span>{t("chooseTaskTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-start">
              {t("chooseTaskDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* List of active/undone tasks */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground text-start block">
                {settings.lang === "ar" ? "المهام المتاحة" : "Available Tasks"}
              </span>
              {tasks.filter((t) => !t.done).length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                  {t("noActiveTasks")}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {tasks
                    .filter((t) => !t.done)
                    .map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          handleSwitchTask(task.id);
                          setShowChooseTaskPrompt(false);
                        }}
                        className="w-full text-start p-3 border border-border rounded-md hover:border-primary hover:bg-accent/40 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-foreground text-sm text-start">
                            {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground text-start">
                            {task.pomodoros} {settings.lang === "ar" ? "جلسات" : "pomodoros"} •{" "}
                            {formatDuration(task.totalSec, settings.lang)}
                          </div>
                        </div>
                        <span className="text-xs text-primary font-medium shrink-0 flex items-center gap-1">
                          {t("selectTask")} &rarr;
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Form to quickly add a new task */}
            <div className="border-t border-border pt-4 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground text-start block">
                {settings.lang === "ar"
                  ? "أو إنشاء مهمة جديدة سريعة"
                  : "Or Create a Quick New Task"}
              </span>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder={t("taskPlaceholder")}
                  value={dialogTitle}
                  onChange={(e) => setDialogTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAndSelect()}
                  className="text-start h-9 text-sm"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign
                      className={`absolute ${
                        settings.lang === "ar" ? "right-2" : "left-2"
                      } top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground`}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t("rateDefault", { rate: settings.defaultHourlyRate })}
                      value={dialogRate}
                      onChange={(e) => setDialogRate(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddAndSelect()}
                      className={`${
                        settings.lang === "ar" ? "pr-7" : "pl-7"
                      } h-9 text-sm no-spinner text-start`}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddAndSelect} className="h-9">
                    <Plus className="mx-1 h-3.5 w-3.5" /> {t("add")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelSessionConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              {t("cancelSessionConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>
              {t("noGoBack")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmCancel}
            >
              {t("yesCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AC =
      (
        window as unknown as {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        }
      ).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      sharedAudioCtx = new AC();
    }
  }
  return sharedAudioCtx;
}

export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    /* ignore */
  }
}

function beep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0.001, startTime);
      // Fast attack
      gainNode.gain.exponentialRampToValueAtTime(0.8, startTime + 0.05);
      // Decay
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play a premium digital chime chord arpeggio (C5, E5, G5, C6) that is loud and clean
    playNote(523.25, now, 0.6); // C5
    playNote(659.25, now + 0.08, 0.6); // E5
    playNote(783.99, now + 0.16, 0.7); // G5
    playNote(1046.5, now + 0.24, 0.8); // C6
  } catch {
    /* ignore */
  }
}
