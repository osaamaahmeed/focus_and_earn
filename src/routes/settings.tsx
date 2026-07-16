import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_SETTINGS, KEYS, Settings, Feedback } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Focus & Earn" },
      { name: "description", content: "Configure timer durations, hourly rate, and currency." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { value, setValue, hydrated, reset } = useLocalStorage<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const { value: feedbacks, setValue: setFeedbacks } = useLocalStorage<Feedback[]>(KEYS.feedback, []);

  if (!hydrated) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const update = <K extends keyof Settings>(key: K, v: Settings[K]) =>
    setValue({ ...value, [key]: v });

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Money</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rate">Default hourly rate</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              value={value.defaultHourlyRate}
              onChange={(e) => update("defaultHourlyRate", num(e.target.value, 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency symbol</Label>
            <Input
              id="currency"
              value={value.currency}
              maxLength={4}
              onChange={(e) => update("currency", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timer durations (minutes)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Focus" id="focus" value={value.focusMin} onChange={(v) => update("focusMin", v)} />
          <Field label="Short break" id="short" value={value.shortBreakMin} onChange={(v) => update("shortBreakMin", v)} />
          <Field label="Long break" id="long" value={value.longBreakMin} onChange={(v) => update("longBreakMin", v)} />
          <Field
            label="Long break every N pomodoros"
            id="every"
            value={value.longBreakEvery}
            onChange={(v) => update("longBreakEvery", Math.max(1, v))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium">Sound on completion</div>
            <div className="text-sm text-muted-foreground">Play a chime when a session ends.</div>
          </div>
          <Switch checked={value.soundOn} onCheckedChange={(v) => update("soundOn", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Bugs & Suggestions Log</CardTitle>
          {feedbacks.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbacks, null, 2));
                  const downloadAnchor = document.createElement("a");
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `feedback-export-${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  toast.success("Feedback logs exported successfully");
                }}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all feedback logs?")) {
                    setFeedbacks([]);
                    toast.success("Feedback logs cleared");
                  }
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No feedback items logged yet. Use the "Feedback" button in the header to submit bugs or suggestions.
            </div>
          ) : (
            <div className="divide-y divide-border border rounded-lg max-h-[300px] overflow-y-auto">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-4 flex gap-4 items-start justify-between hover:bg-muted/30 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={f.type === "bug" ? "destructive" : "default"}>
                        {f.type === "bug" ? "Bug" : "Suggestion"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(f.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-normal text-foreground whitespace-pre-wrap mt-2">{f.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => {
                      setFeedbacks(feedbacks.filter((item) => item.id !== f.id));
                      toast.success("Feedback item deleted");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            reset();
            toast.success("Settings reset to defaults");
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n > 0 ? n : 1);
        }}
      />
    </div>
  );
}