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
  const { value: settings, hydrated: sHy } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const { value: sessions, setValue: setSessions, hydrated: seHy } = useLocalStorage<Session[]>(
    KEYS.sessions,
    [],
  );
  const { value: tasks, hydrated: tHy } = useLocalStorage<Task[]>(KEYS.tasks, []);

  const totals = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

    let today = { sec: 0, money: 0 };
    let week = { sec: 0, money: 0 };
    let all = { sec: 0, money: 0 };
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
    return [...tasks]
      .map((t) => ({ ...t }))
      .sort((a, b) => b.totalEarned - a.totalEarned);
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
    if (window.confirm("Clear all session history? This cannot be undone.")) {
      setSessions([]);
    }
  };

  if (!sHy || !seHy || !tHy) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Today" sec={totals.today.sec} money={totals.today.money} currency={settings.currency} />
        <StatCard label="Last 7 days" sec={totals.week.sec} money={totals.week.money} currency={settings.currency} />
        <StatCard label="All time" sec={totals.all.sec} money={totals.all.money} currency={settings.currency} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>By task</CardTitle>
        </CardHeader>
        <CardContent>
          {perTask.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead className="text-right">Pomodoros</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perTask.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.pomodoros}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(t.totalSec)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(t.totalEarned, settings.currency)}
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
          <CardTitle>Recent sessions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>Export JSON</Button>
            <Button variant="ghost" size="sm" onClick={clearSessions}>Clear history</Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No sessions yet. Finish a pomodoro to see it here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 30).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.endedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{s.taskTitle}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(s.durationSec)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(s.rate, settings.currency)}/hr
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(s.earned, settings.currency)}
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
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums">{formatMoney(money, currency)}</div>
        <div className="text-sm text-muted-foreground mt-1">{formatDuration(sec)} focused</div>
      </CardContent>
    </Card>
  );
}