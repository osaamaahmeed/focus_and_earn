import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  DEFAULT_SETTINGS,
  KEYS,
  Session,
  Settings,
  Task,
  formatDuration,
  formatMoney,
} from "@/lib/store";
import { useTranslation } from "@/lib/translations";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Focus & Earn" },
      { name: "description", content: "See how much time you focused and money you earned." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { t } = useTranslation();
  const { value: settings, hydrated: sHy } = useLocalStorage<Settings>(
    KEYS.settings,
    DEFAULT_SETTINGS,
  );
  const {
    value: sessions,
    setValue: setSessions,
    hydrated: seHy,
  } = useLocalStorage<Session[]>(KEYS.sessions, []);
  const { value: tasks, hydrated: tHy } = useLocalStorage<Task[]>(KEYS.tasks, []);

  const totals = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

    const today = { sec: 0, money: 0 };
    const week = { sec: 0, money: 0 };
    const all = { sec: 0, money: 0 };
    for (const s of sessions) {
      all.sec += s.durationSec;
      all.money += s.earned;
      if (s.endedAt >= weekAgo) {
        week.sec += s.durationSec;
        week.money += s.earned;
      }
      if (s.endedAt >= startOfDay.getTime()) {
        today.sec += s.durationSec;
        today.money += s.earned;
      }
    }
    return { today, week, all };
  }, [sessions]);

  const perTask = useMemo(() => {
    return [...tasks].map((t) => ({ ...t })).sort((a, b) => b.totalEarned - a.totalEarned);
  }, [tasks]);

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      tasks,
      sessions,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focus-earn-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearSessions = () => {
    if (window.confirm(t("clearSessionsConfirm"))) {
      setSessions([]);
    }
  };

  if (!sHy || !seHy || !tHy)
    return <div className="text-muted-foreground text-sm">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t("today")}
          sec={totals.today.sec}
          money={totals.today.money}
          currency={settings.currency}
        />
        <StatCard
          label={t("last7Days")}
          sec={totals.week.sec}
          money={totals.week.money}
          currency={settings.currency}
        />
        <StatCard
          label={t("allTime")}
          sec={totals.all.sec}
          money={totals.all.money}
          currency={settings.currency}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("byTask")}</CardTitle>
        </CardHeader>
        <CardContent>
          {perTask.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("noTasks")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("task")}</TableHead>
                  <TableHead className="text-end">{t("pomodorosFinished")}</TableHead>
                  <TableHead className="text-end">{t("timeLabel")}</TableHead>
                  <TableHead className="text-end">{t("earned")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perTask.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-start">{t.title}</TableCell>
                    <TableCell className="text-end tabular-nums">{t.pomodoros}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatDuration(t.totalSec, settings.lang)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatMoney(t.totalEarned, settings.currency, settings.lang)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("recentSessions")}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              {t("exportJson")}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSessions}>
              {t("clearHistory")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("noSessionsYet")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("when")}</TableHead>
                  <TableHead className="text-start">{t("task")}</TableHead>
                  <TableHead className="text-end">{t("timeLabel")}</TableHead>
                  <TableHead className="text-end">{t("rate")}</TableHead>
                  <TableHead className="text-end">{t("earned")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 30).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground text-start">
                      {new Date(s.endedAt).toLocaleString(
                        settings.lang === "ar" ? "ar-EG" : "en-US",
                      )}
                    </TableCell>
                    <TableCell className="text-start">{s.taskTitle}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatDuration(s.durationSec, settings.lang)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {settings.lang === "ar"
                        ? `${formatMoney(s.rate, settings.currency, settings.lang)}/ساعة`
                        : `${formatMoney(s.rate, settings.currency, settings.lang)}/hr`}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatMoney(s.earned, settings.currency, settings.lang)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  sec,
  money,
  currency,
}: {
  label: string;
  sec: number;
  money: number;
  currency: string;
}) {
  const { t, lang } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums">{formatMoney(money, currency, lang)}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {formatDuration(sec, lang)} {t("focusedLabel")}
        </div>
      </CardContent>
    </Card>
  );
}
